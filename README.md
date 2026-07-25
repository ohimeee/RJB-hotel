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
- [Prisma](https://www.prisma.io) ORM (driver adapter: `@prisma/adapter-pg`)

## Getting Started

### Prerequisites

- Node.js
- PostgreSQL running locally (or a connection string to a hosted instance)

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

4. Apply migrations and generate the Prisma client:
   ```bash
   npx prisma migrate dev
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/                  Next.js App Router pages + API routes
lib/prisma.ts         Prisma Client singleton
prisma/schema.prisma  Data model (Room, Reservation, Charge)
prisma/migrations/    Migration history
```
