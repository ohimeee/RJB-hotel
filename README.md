# InnKeep Express

A lightweight hotel reservation and room management application for boutique
hotels, inns, or student projects. Covers the core guest lifecycle: searching
available rooms, making date-range reservations, handling check-in/check-out
workflows, and billing additional incidental charges.

## Core Features

### Feature 1 · Room Catalog & Availability Search

- **Room Directory** — browse rooms grouped by room type (Standard, Deluxe,
  Suite) with capacity, amenities, and nightly rates
- **Date-Range Availability** — search open rooms by Check-In and Check-Out
  dates
- **Double-Booking Prevention** — rooms with overlapping active reservations are
  filtered out, and a database exclusion constraint makes an overlapping booking
  impossible even under a race

### Feature 2 · Reservation & Booking Management

- **Guest Booking** — reserve an available room for a date range
- **Automated Price Calculation** — nightly rate × number of nights, plus VAT
- **Reservation Lifecycle** — `CONFIRMED` → `CHECKED_IN` → `CHECKED_OUT` /
  `CANCELLED`

### Feature 3 · Check-In, Check-Out & Incidental Billing

- **Front Desk Check-In / Check-Out** — mark guests arrived and departed,
  updating room status (`OCCUPIED` ↔ `AVAILABLE`)
- **Extra Charges Ledger** — room service, minibar, laundry, late check-out
- **Final Folio** — room charges + extra charges, settled at checkout

## Tech Stack

[Next.js](https://nextjs.org) (App Router) · TypeScript · [Tailwind](https://tailwindcss.com) v4 ·
[Supabase](https://supabase.com) Postgres · [`pg`](https://node-postgres.com) with hand-written SQL, no ORM ·
[Xendit](https://www.xendit.co) hosted checkout

## Setup

You need Node.js and the shared `DATABASE_URL` — ask the team. Nothing else to
install; no Postgres on your machine.

```bash
npm install
cp .env.example .env    # paste the shared DATABASE_URL in
npm run dev
```

That's it. The tables and sample rooms already exist on Supabase.

Payments need a Xendit key — see [Xendit](#xendit) below. Everything else
(browsing, holding a room, looking up a booking) works without one.

## Database

Shared **Supabase** Postgres. Supabase *is* Postgres, so nothing in the code is
Supabase-specific: `pg`, raw SQL, and `db/schema.sql` as the source of truth.

- Use the **Session pooler** connection string (Dashboard → Connect). The
  "direct connection" one is IPv6-only and times out on most home internet.
- A free project **sleeps after ~a week idle** and needs a click to wake. Worth
  remembering the morning of a demo.
- `DATABASE_URL` is a password — full read/write on the team's data. `.env` is
  gitignored; share it in a DM, never in a group chat, commit, or screenshot.

**Changing the schema:** edit `db/schema.sql`, run `npm run db:setup`. Never
click tables together in the dashboard — the file is idempotent and lives in
git, so a change there reaches everyone and can be reviewed.

## Xendit

Only needed to test a payment.

Make your own free account — email only, no business documents. Stay in **Test
Mode** and copy two values into `.env`:

- `XENDIT_SECRET_KEY` — Settings → Developers → Generate secret key, **Money-in
  = Write**. Shown once.
- `XENDIT_CALLBACK_TOKEN` — Settings → Webhooks → View Webhook Verification
  Token.

The key must start with `xnd_development_`; `xnd_production_` moves real money.
Never put either behind `NEXT_PUBLIC_`. One account each, not a shared one — an
account holds a single webhook URL, so on a shared account only one person would
receive payment events.

Check it works with `npm run xendit:check` — creates a ₱100 test invoice,
nothing is charged.

### Testing a payment

Xendit can't reach `localhost`, so webhooks never arrive and bookings never
confirm. Run a tunnel:

```bash
ngrok http 3000
```

Register `<printed URL>/api/webhooks/xendit` in Settings → Webhooks (the new
page, not the **legacy** one) and set `APP_URL` to the same origin. One-time
step on a free ngrok domain.

While the tunnel is up your dev server is on the public internet, database
included — stop it when you're done. In test mode e-wallets land on a simulator
where you pick **Authorize** or **Fail**.

## Project Structure

```
app/                     Pages (App Router)
components/              UI (guest + admin)
app/api/webhooks/xendit/ The only place a booking becomes CONFIRMED

lib/db.ts                Connection pool + query helpers
lib/rooms.ts             Catalog + availability query
lib/reservations.ts      Holds, confirmation codes, hold expiry
lib/pricing.ts           Rate -> nights, VAT, total
lib/money.ts             Peso strings and integer centavos
lib/payments.ts          Xendit invoices + webhook token check
lib/billing.ts           Payments against a reservation
lib/schemas.ts           Every zod schema that guards a write
lib/validate.ts          One way to validate untrusted input
lib/result.ts            A thrown error, as a value
lib/types.ts             TypeScript mirrors of the database enums

db/schema.sql            Data model (Room, Reservation, Charge, Payment)
db/seed.sql              Sample rooms
scripts/db.mjs           Applies a .sql file to Supabase
```

## How a booking works

1. Guest picks a room and dates, submits the form.
2. Server **recomputes the price** from the database rate — a total posted by
   the browser is never trusted — and writes the reservation as `PENDING` with a
   15-minute hold. A held room is unavailable to everyone else.
3. Guest is redirected to Xendit's hosted checkout. Card details never touch
   this server.
4. Xendit POSTs to `/api/webhooks/xendit`, which authenticates the request,
   promotes the booking to `CONFIRMED`, and records the payment.
5. Guest lands on `/booking/<code>`, which shows whatever the webhook wrote.

Two things to know before changing any of it:

- **The success redirect is not proof of payment.** Anyone can type that URL.
  Only the webhook confirms a booking.
- **The reservation exists before the money moves.** Charging first would let
  another guest take the room mid-payment.

Abandoned holds are released automatically — the check runs on the availability
query, so there's no cron job.
