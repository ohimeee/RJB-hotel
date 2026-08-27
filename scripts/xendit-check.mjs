// Confirms your Xendit test key works and that GCash is available on the
// hosted checkout page. Run it once after putting your own key in .env —
// everyone on the team has a different one.
//
//   npm run xendit:check
//
// Creates a ₱100 invoice in test mode. Nothing is charged; the invoice is
// never paid and expires on its own.
import "dotenv/config";

const key = process.env.XENDIT_SECRET_KEY;

if (!key) {
  console.error("XENDIT_SECRET_KEY missing from .env");
  process.exit(1);
}

if (!key.startsWith("xnd_development_")) {
  console.error("That is not a test key. Refusing to run against live.");
  process.exit(1);
}

// Basic auth: secret key as username, empty password.
const auth = "Basic " + Buffer.from(`${key}:`).toString("base64");

// Deliberately 100, not 10000. Whatever the hosted page renders tells us
// whether `amount` is pesos or centavos — that decides how quoteStay() feeds
// this later.
const body = {
  external_id: `smoke-${Date.now()}`,
  amount: 100,
  currency: "PHP",
  description: "Smoke test - Courtyard Deluxe, 1 night",
  success_redirect_url: "http://localhost:3000/booking/success",
  failure_redirect_url: "http://localhost:3000/my-bookings",
};

const res = await fetch("https://api.xendit.co/v2/invoices", {
  method: "POST",
  headers: { Authorization: auth, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log("HTTP", res.status);

if (!res.ok) {
  console.error(text);
  process.exit(1);
}

const data = JSON.parse(text);

console.log("id:              ", data.id);
console.log("status:          ", data.status);
console.log("amount echoed:   ", data.amount, data.currency);
console.log("available banks: ", (data.available_banks ?? []).length);
console.log(
  "ewallets:        ",
  (data.available_ewallets ?? []).map((e) => e.ewallet_type).join(", ") ||
    "(none listed)",
);
console.log("\nOpen this and check GCash is offered:\n");
console.log(data.invoice_url);
