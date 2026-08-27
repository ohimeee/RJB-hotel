# InnKeep Express

Lightweight hotel reservation and room management app for boutique hotels, inns, or student projects. Covers the guest lifecycle: room search, date-range booking, check-in/check-out, and incidental billing.

## Features

- **Room Catalog & Availability** — browse rooms by type (Standard/Deluxe/Suite), search by check-in/check-out dates, auto-filter out double-booked rooms
- **Reservations** — book a room for a date range, auto-calculate stay total, track status (`CONFIRMED` → `CHECKED_IN` → `CHECKED_OUT` / `CANCELLED`)
- **Check-In / Check-Out** — front desk updates room status (`AVAILABLE` ↔ `OCCUPIED`)
- **Incidental Billing** — add extra charges (room service, minibar, laundry, etc.) to a stay, generate final folio

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [PostgreSQL](https://www.postgresql.org)
- [node-postgres](https://node-postgres.com) (`pg`) — hand-written SQL, no ORM
- [Xendit](https://www.xendit.co) — hosted checkout for GCash, Maya, GrabPay and cards

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL running locally (or a connection string to a hosted instance)
- A [Xendit](https://dashboard.xendit.co) account for payments — test mode needs
  only an email, no business documents

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a database:
   ```bash
   createdb rjb_hotel
   ```

3. Copy the env template and fill in your own credentials:
   ```bash
   cp .env.example .env
   ```

   `APP_URL` is the origin Xendit sends guests back to. Leave it as
   `http://localhost:3000` for browsing; set it to your ngrok URL before
   testing a payment (see below).

   For payments, make your own free [Xendit](https://dashboard.xendit.co)
   account — email only, no business documents, and ignore the "Verify Your
   Business" banner. Stay in **Test Mode**, then take two values from the
   dashboard:

   - `XENDIT_SECRET_KEY` — Settings → Developers → Generate secret key, with
     **Money-in = Write**. Shown once, so copy it immediately.
   - `XENDIT_CALLBACK_TOKEN` — Settings → Webhooks → View Webhook
     Verification Token.

   The secret key must start with `xnd_development_`; a `xnd_production_` key
   moves real money. Never put either behind `NEXT_PUBLIC_`, which ships the
   value to the browser, and never paste one into a chat or screenshot.

   One account each rather than a shared one — an account holds a single
   webhook URL, so on a shared account only one person would receive payment
   events and everyone else's bookings would silently never confirm.

4. Create the tables, then load the sample rooms:
   ```bash
   npm run db:setup
   npm run db:seed
   ```

   Both are safe to re-run. `db:setup` only creates what is missing, and
   `db:seed` upserts rooms on their room number.

5. Confirm your Xendit key works:
   ```bash
   npm run xendit:check
   ```

   Creates a ₱100 test invoice — nothing is charged. Look for `GCASH` in the
   `ewallets` line. It refuses to run against a production key.

6. Run the dev server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Testing payments

Xendit's servers cannot reach `localhost`, so payment webhooks never arrive in
development and bookings never confirm. Run a tunnel alongside the dev server:

```bash
ngrok http 3000
```

Register `<the URL it prints>/api/webhooks/xendit` in Dashboard → Settings →
Webhooks, and set `APP_URL` in `.env` to the same origin. A free ngrok account
gets one permanent domain, so that registration is a one-time step.

Switch off the **legacy** webhook page when registering — the current product
events are only listed on the new one. And note that while the tunnel is up your
dev server is genuinely on the public internet, database included: stop it when
you are not testing.

In test mode no real money moves. E-wallet payments land on a Xendit simulator
page where you choose **Authorize** or **Fail** — no real GCash account needed.
Test card numbers are listed in the Xendit dashboard.

## Project Structure

```
app/                          Next.js App Router pages
components/                   UI components (guest + admin)
lib/db.ts                     Postgres connection pool + query helpers
lib/types.ts                  TypeScript mirrors of the database enums
lib/rooms.ts                  Catalog + availability query
lib/pricing.ts                Nightly rate -> nights, VAT, total
lib/money.ts                  Peso strings and integer centavos
lib/reservations.ts           Holds, confirmation codes, hold expiry
lib/payments.ts               Xendit invoices + webhook token check
lib/billing.ts                Payments against a reservation
app/api/webhooks/xendit/      The only place a booking becomes CONFIRMED
db/schema.sql                 Data model (Room, Reservation, Charge, Payment)
db/seed.sql                   Sample rooms
scripts/db.mjs                Runs a .sql file against DATABASE_URL
```

## How a booking works

1. The guest picks a room and dates and submits the checkout form.
2. The server recomputes the price from the rate in the database — a total
   posted by the browser is never trusted — and writes the reservation as
   `PENDING` with a 15-minute hold. A held room is unavailable to everyone else.
3. The guest is redirected to a Xendit hosted checkout page. Card details never
   touch this server.
4. Xendit POSTs to `/api/webhooks/xendit`. That handler authenticates the
   request, promotes the booking to `CONFIRMED` and records the payment.
5. The guest lands back on `/booking/<code>`, which reports whatever status the
   webhook already wrote.

Two things worth knowing before changing any of this:

- **The success redirect is not proof of payment.** It is a URL anyone can type.
  Only the webhook confirms a booking.
- **The reservation exists before the money moves.** Charging first would let
  another guest take the room mid-payment, leaving someone who has paid for a
  room that is gone.

A hold whose guest never came back is released automatically — the check runs on
the availability query, so no cron job is involved.
