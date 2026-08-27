// End-to-end check of the guest booking path, against the real database.
//
//   npm run test:booking            full run, creates one live test invoice
//   npm run test:booking -- --offline   skips anything that calls Xendit
//
// No dev server and no test-only route: the modules under lib/ and the webhook
// handler are imported and called directly, so what runs here is the same code
// the app runs. See scripts/ts-alias.mjs for how that works.
//
// Every row it creates is cleaned up at the end, and it refuses to run against
// a production Xendit key.
import "dotenv/config";

import { pool, query } from "@/lib/db";
import { findAvailableRooms } from "@/lib/rooms";
import { createInvoice } from "@/lib/payments";
import {
  createReservation,
  getReservationByCode,
  releaseExpiredHolds,
} from "@/lib/reservations";
import { POST as xenditWebhook } from "@/app/api/webhooks/xendit/route.ts";

const OFFLINE = process.argv.includes("--offline");

/** Every row this script writes carries it, so cleanup can find them all. */
const MARKER = "Booking Self-Test";

// Far enough out that a real booking will never collide with the test.
const CHECK_IN = "2033-02-10";
const CHECK_OUT = "2033-02-13";
const NIGHTS = 3;

let passed = 0;
let failed = 0;

const check = (label, ok, detail = "") => {
  console.log(
    `  ${ok ? "[32mPASS[0m" : "[31mFAIL[0m"}  ${label}${
      detail ? `  [90m${detail}[0m` : ""
    }`,
  );
  if (ok) passed += 1;
  else failed += 1;
};

const section = (title) => console.log(`\n[1m${title}[0m`);

const cleanup = async () => {
  await query(
    `DELETE FROM "Payment" WHERE "reservationId" IN
       (SELECT "id" FROM "Reservation" WHERE "guestName" = $1)`,
    [MARKER],
  );
  await query(`DELETE FROM "Reservation" WHERE "guestName" = $1`, [MARKER]);
};

const webhook = (token, payload) =>
  xenditWebhook(
    new Request("https://example.test/api/webhooks/xendit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "x-callback-token": token } : {}),
      },
      body: JSON.stringify(payload),
    }),
  );

const run = async () => {
  const key = process.env.XENDIT_SECRET_KEY ?? "";

  if (!OFFLINE && key && !key.startsWith("xnd_development_")) {
    console.error("That is not a test key. Refusing to run against live.");
    process.exit(1);
  }

  const liveGateway = !OFFLINE && key.startsWith("xnd_development_");

  // Anything left behind by an interrupted earlier run.
  await cleanup();

  const [room] = await query(
    `SELECT "id", "name", "nightlyRate", "capacity" FROM "Room" ORDER BY "nightlyRate" ASC LIMIT 1`,
  );

  if (!room) {
    console.error('No rooms in the database. Run "npm run db:seed" first.');
    process.exit(1);
  }

  console.log(
    `\nRoom: ${room.name} at ${room.nightlyRate}/night, ${CHECK_IN} -> ${CHECK_OUT}` +
      `${liveGateway ? "" : "  (offline — skipping Xendit)"}`,
  );

  const listed = async () =>
    (
      await findAvailableRooms({
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        guests: 1,
      })
    ).some((r) => r.id === room.id);

  section("Availability");
  check("room is bookable before any hold", await listed());

  section("Holding a room");
  const held = await createReservation({
    roomId: room.id,
    guestName: MARKER,
    guestCount: 1,
    checkIn: CHECK_IN,
    checkOut: CHECK_OUT,
  });

  check("reservation created", held.ok === true, held.error ?? "");

  if (!held.ok) {
    await cleanup();
    console.log("\nCannot continue without a reservation.\n");
    process.exit(1);
  }

  const { reservation, quote } = held;

  // Priced from the rate in the database, never from anything a client sent.
  const expectedRoom = Math.round(Number(room.nightlyRate) * 100) * NIGHTS;
  const expectedTax = Math.round((expectedRoom * 12) / 100);
  const asPesos = (centavos) =>
    `${Math.trunc(centavos / 100)}.${String(centavos % 100).padStart(2, "0")}`;

  check(
    "held as PENDING",
    reservation.status === "PENDING",
    reservation.status,
  );
  check("hold has an expiry", reservation.holdExpiresAt instanceof Date);
  check(
    "confirmation code issued",
    /^IKX-\d{4}$/.test(reservation.confirmationCode),
    reservation.confirmationCode,
  );
  check(
    `${NIGHTS} nights priced`,
    quote.nights === NIGHTS,
    String(quote.nights),
  );
  check(
    "room total = rate x nights",
    quote.roomTotal === asPesos(expectedRoom),
    quote.roomTotal,
  );
  check(
    "VAT is 12% of the room total",
    reservation.taxAmount === asPesos(expectedTax),
    reservation.taxAmount,
  );
  check(
    "total = room + VAT",
    reservation.totalAmount === asPesos(expectedRoom + expectedTax),
    reservation.totalAmount,
  );

  section("A held room is unsellable");
  check("hold removes the room from the catalog", !(await listed()));

  const second = await createReservation({
    roomId: room.id,
    guestName: MARKER,
    guestCount: 1,
    // Overlaps by one night — the half-open range must still catch it.
    checkIn: "2033-02-12",
    checkOut: "2033-02-15",
  });
  check(
    "overlapping booking refused",
    second.ok === false && second.error === "ROOM_TAKEN",
    second.error ?? "allowed",
  );

  const adjacent = await createReservation({
    roomId: room.id,
    guestName: MARKER,
    guestCount: 1,
    // Arrives the day the first guest leaves. Must be allowed.
    checkIn: CHECK_OUT,
    checkOut: "2033-02-15",
  });
  check(
    "same-day turnover allowed",
    adjacent.ok === true,
    adjacent.error ?? "",
  );

  const tooMany = await createReservation({
    roomId: room.id,
    guestName: MARKER,
    guestCount: room.capacity + 1,
    checkIn: "2033-07-01",
    checkOut: "2033-07-02",
  });
  check(
    "over-capacity booking refused",
    tooMany.ok === false && tooMany.error === "OVER_CAPACITY",
    tooMany.error ?? "allowed",
  );

  if (liveGateway) {
    section("Xendit");
    const invoiceUrl = await createInvoice({
      reservationId: reservation.id,
      confirmationCode: reservation.confirmationCode,
      amount: reservation.totalAmount,
      description: "Booking self-test",
    });
    check(
      "hosted invoice created",
      invoiceUrl.startsWith("https://"),
      invoiceUrl,
    );

    const auth = `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
    const invoice = await (
      await fetch(
        `https://api.xendit.co/v2/invoices/${invoiceUrl.split("/").pop()}`,
        {
          headers: { Authorization: auth },
        },
      )
    ).json();

    const wallets = (invoice.available_ewallets ?? []).map(
      (e) => e.ewallet_type,
    );
    const retail = (invoice.available_retail_outlets ?? []).map(
      (r) => r.retail_outlet_name,
    );

    // Xendit takes pesos, not centavos — the opposite of Stripe and PayMongo.
    check(
      "amount sent in pesos, not centavos",
      invoice.amount === Number(reservation.totalAmount),
      `${invoice.amount} vs ${reservation.totalAmount}`,
    );
    check("GCash offered", wallets.includes("GCASH"), wallets.join(", "));
    check(
      "retail outlets excluded",
      retail.length === 0,
      retail.join(", ") || "none",
    );
    check(
      "bank channels offered",
      (invoice.available_direct_debits ?? []).length > 0,
      `${(invoice.available_direct_debits ?? []).length} banks`,
    );
  }

  section("The webhook is the only proof of payment");
  const event = {
    id: `self-test-${Date.now()}`,
    external_id: reservation.id,
    status: "PAID",
    amount: Number(reservation.totalAmount),
    payment_channel: "GCASH",
    payment_method: "EWALLET",
    paid_at: "2033-02-01T08:30:00.000Z",
  };

  const statusOf = async (id) =>
    (await query(`SELECT "status" FROM "Reservation" WHERE "id" = $1`, [id]))[0]
      ?.status;

  check("no token rejected", (await webhook(null, event)).status === 401);
  check(
    "wrong token rejected",
    (await webhook("wrong-token", event)).status === 401,
  );
  check(
    "rejected requests changed nothing",
    (await statusOf(reservation.id)) === "PENDING",
  );

  const token = process.env.XENDIT_CALLBACK_TOKEN;

  if (!token) {
    check(
      "XENDIT_CALLBACK_TOKEN is set",
      false,
      "missing from .env — skipping the rest",
    );
  } else {
    const accepted = await webhook(token, event);
    const body = await accepted.json();
    check(
      "valid callback accepted",
      accepted.status === 200 && body.confirmed === true,
      JSON.stringify(body),
    );
    check(
      "booking promoted to CONFIRMED",
      (await statusOf(reservation.id)) === "CONFIRMED",
    );

    const [payment] = await query(
      `SELECT * FROM "Payment" WHERE "reservationId" = $1`,
      [reservation.id],
    );
    check("payment recorded", Boolean(payment));
    check("GCASH channel mapped", payment?.method === "GCASH", payment?.method);
    check(
      "amount recorded",
      payment?.amount === reservation.totalAmount,
      payment?.amount,
    );
    // A webhook redelivered an hour later must not restamp the folio.
    check(
      "paidAt taken from the payload",
      payment?.paidAt?.toISOString() === event.paid_at,
      String(payment?.paidAt),
    );

    const replay = await (await webhook(token, event)).json();
    check(
      "redelivered event is a no-op",
      replay.duplicate === true && replay.confirmed === false,
      JSON.stringify(replay),
    );

    const [{ count }] = await query(
      `SELECT count(*)::int FROM "Payment" WHERE "reservationId" = $1`,
      [reservation.id],
    );
    check("no second payment row", count === 1, String(count));

    const ignored = await (
      await webhook(token, {
        ...event,
        id: "self-test-expired",
        status: "EXPIRED",
      })
    ).json();
    check(
      "non-PAID event ignored",
      ignored.ignored === "EXPIRED",
      JSON.stringify(ignored),
    );
  }

  section("Lookup and hold expiry");
  const found = await getReservationByCode(reservation.confirmationCode);
  check("lookup by confirmation code", found?.id === reservation.id);
  check(
    "unknown code returns nothing",
    (await getReservationByCode("IKX-0000-nope")) === null,
  );

  // Push the surviving hold into the past and prove the sweep frees the room.
  await query(
    `UPDATE "Reservation" SET "holdExpiresAt" = now() - interval '1 minute'
      WHERE "guestName" = $1 AND "status" = 'PENDING'`,
    [MARKER],
  );
  const released = await releaseExpiredHolds();
  check("expired hold released", released > 0, `${released} released`);

  const [survivor] = await query(
    `SELECT "status" FROM "Reservation" WHERE "id" = $1`,
    [adjacent.ok ? adjacent.reservation.id : reservation.id],
  );
  check(
    "expired hold was cancelled, not deleted",
    survivor?.status === "CANCELLED",
    survivor?.status,
  );

  await cleanup();

  const [{ count: leftover }] = await query(
    `SELECT count(*)::int FROM "Reservation" WHERE "guestName" = $1`,
    [MARKER],
  );
  check("test rows cleaned up", leftover === 0, `${leftover} left`);

  console.log(
    `\n${passed} passed, ${failed} failed${liveGateway ? "" : "  (Xendit checks skipped)"}\n`,
  );
};

try {
  await run();
} catch (error) {
  console.error("\nSelf-test crashed:\n", error);
  await cleanup().catch(() => {});
  failed += 1;
} finally {
  await pool.end();
}

process.exit(failed ? 1 : 0);
