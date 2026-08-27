# InnKeep Express

A hotel reservation and room management app for boutique hotels and inns. It
covers the guest lifecycle: searching for available rooms, booking a date range,
checking guests in and out, and billing incidental charges.

## Core Features

### Feature 1: Room Catalog & Availability Search

- Room Directory: browse rooms grouped by room type (Standard, Deluxe, Suite)
  with capacity, amenities, and nightly rates.
- Date-Range Availability: search for open rooms by Check-In and Check-Out date.
- Double-Booking Prevention: rooms with overlapping active reservations are
  filtered out. A database exclusion constraint blocks an overlapping booking
  even if two guests book at the same moment.

### Feature 2: Reservation & Booking Management

- Guest Booking: reserve an available room for a date range.
- Automated Price Calculation: nightly rate times number of nights, plus VAT.
- Reservation Lifecycle: `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`.

### Feature 3: Check-In, Check-Out & Incidental Billing

- Front Desk Check-In / Check-Out: mark guests arrived and departed, updating
  room status (`OCCUPIED` or `AVAILABLE`).
- Extra Charges Ledger: room service, minibar, laundry, late check-out.
- Final Folio: room charges plus extra charges, settled at checkout.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Supabase](https://supabase.com) Postgres
- [node-postgres](https://node-postgres.com) (`pg`), hand-written SQL, no ORM
- [Xendit](https://www.xendit.co) hosted checkout

## Setup

You need Node.js and the shared `DATABASE_URL`. Ask the team for it. There is no
Postgres to install.

```bash
npm install
cp .env.example .env    # paste the shared DATABASE_URL in
npm run dev
```

The tables and sample rooms already exist on Supabase, so there is nothing else
to run.

Testing a payment needs a Xendit key. See [Xendit](#xendit) below. Browsing
rooms, holding one, and looking up a booking all work without one.

## Database

The database is a shared Supabase Postgres. Supabase is Postgres, so nothing in
the code is Supabase-specific. We use `pg` with raw SQL, and `db/schema.sql` is
the source of truth for the data model.

Three things to know:

1. Use the Session pooler connection string, from Dashboard > Connect. The
   direct connection string is IPv6-only and will time out on most home
   internet.
2. A free project sleeps after about a week of no use. Waking it takes one click
   in the dashboard.
3. `DATABASE_URL` is a password. It gives full read and write access to the
   team's data. `.env` is gitignored, so send the string in a DM, not in a group
   chat, a commit, or a screenshot.

To change the schema, edit `db/schema.sql` and run `npm run db:setup`. Do not
create tables by clicking around the dashboard. The file is idempotent and lives
in git, so a change there reaches everyone and can be reviewed.

## Xendit

Only needed to test a payment.

Make your own free account. Email only, no business documents. Stay in Test Mode
and copy two values into `.env`:

- `XENDIT_SECRET_KEY`: Settings > Developers > Generate secret key, with
  Money-in set to Write. It is shown once.
- `XENDIT_CALLBACK_TOKEN`: Settings > Webhooks > View Webhook Verification
  Token.

The key must start with `xnd_development_`. A `xnd_production_` key moves real
money. Never put either behind `NEXT_PUBLIC_`.

Use one account each rather than a shared one. An account holds a single webhook
URL, so on a shared account only one person receives payment events.

Run `npm run xendit:check` to confirm your key works. It creates a ₱100 test
invoice and charges nothing.

### Testing a payment

Xendit cannot reach `localhost`, so webhooks never arrive and bookings never
confirm. Run a tunnel:

```bash
ngrok http 3000
```

Register `<printed URL>/api/webhooks/xendit` in Settings > Webhooks, on the new
page rather than the legacy one, and set `APP_URL` to the same origin. On a free
ngrok domain this is a one-time step.

While the tunnel is up your dev server is on the public internet, database
included. Stop it when you are done. In test mode, e-wallet payments land on a
simulator where you pick Authorize or Fail.

## Project Structure

```
app/                     Pages (App Router)
components/              UI (guest + admin)
app/api/webhooks/xendit/ The only place a booking becomes CONFIRMED

lib/db.ts                Connection pool and query helpers
lib/rooms.ts             Catalog and availability query
lib/reservations.ts      Holds, confirmation codes, hold expiry
lib/pricing.ts           Rate to nights, VAT, total
lib/money.ts             Peso strings and integer centavos
lib/payments.ts          Xendit invoices and webhook token check
lib/billing.ts           Payments against a reservation
lib/schemas.ts           Zod schemas for anything that writes
lib/validate.ts          Validation used by actions and routes
lib/result.ts            Turns a thrown error into a return value
lib/types.ts             TypeScript mirrors of the database enums

db/schema.sql            Data model (Room, Reservation, Charge, Payment)
db/seed.sql              Sample rooms
scripts/db.mjs           Applies a .sql file to Supabase
```

## How a booking works

1. The guest picks a room and dates, then submits the form.
2. The server recomputes the price from the rate stored in the database. A total
   posted by the browser is never trusted. The reservation is written as
   `PENDING` with a 15-minute hold, and a held room is unavailable to everyone
   else.
3. The guest is redirected to Xendit's hosted checkout, so card details never
   touch this server.
4. Xendit sends a POST to `/api/webhooks/xendit`. That handler authenticates the
   request, promotes the booking to `CONFIRMED`, and records the payment.
5. The guest lands on `/booking/<code>`, which shows whatever the webhook wrote.

Two things to know before changing any of this:

- The success redirect is not proof of payment. Anyone can type that URL. Only
  the webhook confirms a booking.
- The reservation is written before the money moves. Charging first would let
  another guest take the room mid-payment.

Holds that nobody comes back to are released automatically. The check runs as
part of the availability query, so there is no cron job.
