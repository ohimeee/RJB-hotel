import { query, queryOne } from "@/lib/db";
import { formatPeso } from "@/lib/money";
import { quoteStay, type Quote } from "@/lib/pricing";
import { nights } from "@/lib/dates";
import type { ReservationStatus, RoomType } from "@/lib/types";

/**
 * How long a room stays held while the guest is on Xendit's payment page.
 *
 * Long enough to finish a GCash payment, short enough that an abandoned
 * checkout does not block a sellable room all day. Nothing in the spec sets
 * this — see IMPLEMENTATION.md, Section 12.
 */
export const HOLD_MINUTES = 15;

/** Codes are `IKX-` plus four digits — short enough to read off a phone. */
const CODE_PREFIX = "IKX-";

/**
 * 10,000 codes is a small space, so a collision is a matter of when. The unique
 * index is what actually prevents a duplicate; this is just how many times we
 * are willing to reroll before giving up.
 */
const CODE_ATTEMPTS = 10;

/** Postgres SQLSTATEs the booking path expects and handles by name. */
const UNIQUE_VIOLATION = "23505";
const EXCLUSION_VIOLATION = "23P01";

const isPgError = (error: unknown, code: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === code;

const generateCode = (): string =>
  CODE_PREFIX + String(Math.floor(Math.random() * 10_000)).padStart(4, "0");

export type ReservationRow = {
  id: string;
  confirmationCode: string;
  roomId: string;
  guestName: string;
  guestCount: number;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  totalAmount: string;
  taxAmount: string;
  holdExpiresAt: Date | null;
};

/** A reservation joined to its room, for the confirmation page. */
export type ReservationDetail = ReservationRow & {
  roomName: string;
  roomNumber: string;
  roomType: RoomType;
  nightlyRate: string;
  quote: Quote;
  totalLabel: string;
};

export type NewReservation = {
  roomId: string;
  guestName: string;
  guestCount: number;
  checkIn: string;
  checkOut: string;
};

/**
 * Why a booking was refused. The action turns these into guest-facing copy;
 * keeping them as codes means the reason survives a redirect in a query string.
 */
export type BookingError =
  "ROOM_NOT_FOUND" | "OVER_CAPACITY" | "ROOM_TAKEN" | "CODE_EXHAUSTED";

export type BookingResult =
  | { ok: true; reservation: ReservationRow; quote: Quote }
  | { ok: false; error: BookingError };

/**
 * Release holds nobody came back for.
 *
 * A guest who closes the tab mid-payment would otherwise block that room until
 * someone noticed. Cancelling rather than deleting keeps the row: a payment
 * that lands after the hold lapsed still has something to attach to, and the
 * front desk can see what happened. A CANCELLED row is outside the
 * no-double-booking predicate, so the room is free the moment this runs.
 *
 * Called at the top of the availability read path — cheap, since the WHERE
 * matches nothing on almost every call, and it means no cron job has to exist
 * for the demo to behave correctly.
 */
export const releaseExpiredHolds = async (): Promise<number> => {
  const rows = await query<{ id: string }>(
    `
    UPDATE "Reservation"
       SET "status" = 'CANCELLED', "holdExpiresAt" = NULL
     WHERE "status" = 'PENDING'
       AND "holdExpiresAt" IS NOT NULL
       AND "holdExpiresAt" < now()
    RETURNING "id"
    `,
  );

  return rows.length;
};

const RESERVATION_COLUMNS = `
  "id",
  "confirmationCode",
  "roomId",
  "guestName",
  "guestCount",
  "checkIn",
  "checkOut",
  "status",
  "totalAmount",
  "taxAmount",
  "holdExpiresAt"
`;

/**
 * Hold a room and price the stay.
 *
 * The reservation exists *before* the money moves. Charging first and inserting
 * after would let another guest take the room mid-payment, leaving someone who
 * has paid for a room that is gone — and a refund path we would then have to
 * build. So the row goes in as PENDING, which blocks availability, and the
 * webhook promotes it once Xendit confirms the payment.
 *
 * The total is computed here from the rate in the database. A price posted by
 * the client is never trusted: the checkout page displays a total, it does not
 * get to decide one.
 *
 * There is no explicit transaction. The insert is a single statement, and the
 * check-then-insert race it would otherwise need to guard is already closed by
 * the `Reservation_no_double_booking` exclusion constraint — the database
 * refuses an overlapping row outright, and 23P01 is that refusal.
 */
export const createReservation = async ({
  roomId,
  guestName,
  guestCount,
  checkIn,
  checkOut,
}: NewReservation): Promise<BookingResult> => {
  // Expired holds first, so a guest is not told a room is taken by a checkout
  // somebody abandoned twenty minutes ago.
  await releaseExpiredHolds();

  const room = await queryOne<{ nightlyRate: string; capacity: number }>(
    `SELECT "nightlyRate", "capacity" FROM "Room" WHERE "id" = $1`,
    [roomId],
  );

  if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };
  if (guestCount > room.capacity) return { ok: false, error: "OVER_CAPACITY" };

  const quote = quoteStay(room.nightlyRate, nights(checkIn, checkOut));

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    try {
      const reservation = await queryOne<ReservationRow>(
        `
        INSERT INTO "Reservation" (
          "roomId", "confirmationCode", "guestName", "guestCount",
          "checkIn", "checkOut", "status",
          "totalAmount", "taxAmount", "holdExpiresAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, now() + ($9 || ' minutes')::interval)
        RETURNING ${RESERVATION_COLUMNS}
        `,
        [
          roomId,
          generateCode(),
          guestName,
          guestCount,
          checkIn,
          checkOut,
          quote.total,
          quote.tax,
          String(HOLD_MINUTES),
        ],
      );

      // queryOne only returns null on no rows, and RETURNING on a successful
      // INSERT always produces one.
      return { ok: true, reservation: reservation!, quote };
    } catch (error) {
      // Someone else holds or occupies this room for an overlapping range.
      if (isPgError(error, EXCLUSION_VIOLATION)) {
        return { ok: false, error: "ROOM_TAKEN" };
      }

      // Code collision — reroll. Any other unique violation is a real bug and
      // should not be swallowed by the retry loop.
      if (
        isPgError(error, UNIQUE_VIOLATION) &&
        typeof error === "object" &&
        error !== null &&
        (error as { constraint?: string }).constraint ===
          "Reservation_confirmationCode_key"
      ) {
        continue;
      }

      throw error;
    }
  }

  return { ok: false, error: "CODE_EXHAUSTED" };
};

/**
 * Look a booking up by the code on the guest's confirmation. Guests have no
 * accounts, so this is the only way back to a reservation.
 */
export const getReservationByCode = async (
  code: string,
): Promise<ReservationDetail | null> => {
  const row = await queryOne<
    ReservationRow & {
      roomName: string;
      roomNumber: string;
      roomType: RoomType;
      nightlyRate: string;
    }
  >(
    `
    SELECT
      res."id",
      res."confirmationCode",
      res."roomId",
      res."guestName",
      res."guestCount",
      res."checkIn",
      res."checkOut",
      res."status",
      res."totalAmount",
      res."taxAmount",
      res."holdExpiresAt",
      r."name"        AS "roomName",
      r."number"      AS "roomNumber",
      r."type"        AS "roomType",
      r."nightlyRate" AS "nightlyRate"
    FROM "Reservation" res
    JOIN "Room" r ON r."id" = res."roomId"
    WHERE res."confirmationCode" = $1
    `,
    [code],
  );

  if (!row) return null;

  return {
    ...row,
    quote: quoteStay(row.nightlyRate, nights(row.checkIn, row.checkOut)),
    totalLabel: formatPeso(row.totalAmount),
  };
};

/**
 * Give a held room back before its window is up.
 *
 * For the case where checkout fails after the hold was written — the gateway is
 * unreachable, say. Waiting for the sweep would keep the room off the market
 * for the full window over a failure the guest had no part in.
 *
 * Guarded on PENDING so this can never touch a paid booking, even if a webhook
 * confirmed it in the meantime.
 */
export const releaseHold = async (id: string): Promise<void> => {
  await query(
    `
    UPDATE "Reservation"
       SET "status" = 'CANCELLED', "holdExpiresAt" = NULL
     WHERE "id" = $1
       AND "status" = 'PENDING'
    `,
    [id],
  );
};

/**
 * Promote a paid hold. Returns the reservation if this call is what confirmed
 * it, and null if it was already confirmed or is no longer PENDING — which is
 * what makes a redelivered webhook a no-op rather than a second confirmation.
 */
export const confirmReservation = async (
  id: string,
): Promise<ReservationRow | null> =>
  queryOne<ReservationRow>(
    `
    UPDATE "Reservation"
       SET "status" = 'CONFIRMED', "holdExpiresAt" = NULL
     WHERE "id" = $1
       AND "status" = 'PENDING'
    RETURNING ${RESERVATION_COLUMNS}
    `,
    [id],
  );

export const getReservation = async (
  id: string,
): Promise<ReservationRow | null> =>
  queryOne<ReservationRow>(
    `SELECT ${RESERVATION_COLUMNS} FROM "Reservation" WHERE "id" = $1`,
    [id],
  );
