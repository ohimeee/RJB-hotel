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

   For payments, add your Xendit **test** credentials from the dashboard:
   `XENDIT_SECRET_KEY` (Settings → Developers → generate a secret key with
   Money-in = Write) and `XENDIT_CALLBACK_TOKEN` (Settings → Webhooks → view
   verification token). The secret key must start with `xnd_development_` — a
   `xnd_production_` key moves real money. Never put either behind
   `NEXT_PUBLIC_`; that ships the value to the browser.

4. Create the tables, then load the sample rooms:
   ```bash
   npm run db:setup
   npm run db:seed
   ```

   Both are safe to re-run. `db:setup` only creates what is missing, and
   `db:seed` upserts rooms on their room number.

5. Run the dev server:
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

Register the URL it prints in Dashboard → Settings → Webhooks. A free ngrok
account gets one permanent domain, so that registration is a one-time step.

In test mode no real money moves. E-wallet payments land on a Xendit simulator
page where you choose **Authorize** or **Fail** — no real GCash account needed.
Test card numbers are listed in the Xendit dashboard.

## Project Structure

```
app/             Next.js App Router pages
components/      UI components (guest + admin)
lib/db.ts        Postgres connection pool + query helpers
lib/types.ts     TypeScript mirrors of the database enums
db/schema.sql    Data model (Room, Reservation, Charge)
db/seed.sql      Sample rooms
scripts/db.mjs   Runs a .sql file against DATABASE_URL
```
