-- Full schema for rjb_hotel. Safe to re-run: every object is created only if
-- it is missing, so this doubles as the setup script and the reference copy of
-- the data model.
--
-- Apply with:  npm run db:setup

-- gen_random_uuid() lives in core Postgres from 13 onwards. Ids stay TEXT so
-- they read the same in URLs as they did before, and so the app never has to
-- generate one.

DO $$ BEGIN
  CREATE TYPE "RoomType" AS ENUM ('STANDARD', 'DELUXE', 'SUITE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Keeps "updatedAt" honest without every UPDATE having to remember it.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS "Room" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "number"      TEXT NOT NULL UNIQUE,
  "name"        TEXT NOT NULL,
  "type"        "RoomType" NOT NULL,
  "capacity"    INTEGER NOT NULL,
  "amenities"   TEXT[] NOT NULL DEFAULT '{}',
  "description" TEXT,
  "imageUrl"    TEXT,
  "nightlyRate" DECIMAL(10,2) NOT NULL,
  "status"      "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Reservation" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "roomId"      TEXT NOT NULL REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "guestName"   TEXT NOT NULL,
  "checkIn"     DATE NOT NULL,
  "checkOut"    DATE NOT NULL,
  "status"      "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
  "totalAmount" DECIMAL(10,2) NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT now(),

  -- A stay must end after it starts. Cheap guard, and it makes the half-open
  -- overlap check in lib/rooms.ts safe to reason about.
  CONSTRAINT "Reservation_dates_check" CHECK ("checkOut" > "checkIn")
);

CREATE TABLE IF NOT EXISTS "Charge" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "reservationId" TEXT NOT NULL REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "description"   TEXT NOT NULL,
  "amount"        DECIMAL(10,2) NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- Availability search filters by room and date range, in that order.
CREATE INDEX IF NOT EXISTS "Reservation_roomId_checkIn_checkOut_idx"
  ON "Reservation" ("roomId", "checkIn", "checkOut");

DROP TRIGGER IF EXISTS "Room_set_updated_at" ON "Room";
CREATE TRIGGER "Room_set_updated_at" BEFORE UPDATE ON "Room"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS "Reservation_set_updated_at" ON "Reservation";
CREATE TRIGGER "Reservation_set_updated_at" BEFORE UPDATE ON "Reservation"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Bring an already-created database up to the definitions above. The CREATE
-- statements are skipped once the tables exist, so the defaults that used to
-- be the ORM's job — ids, timestamps — have to be set explicitly here. All of
-- this is idempotent.

ALTER TABLE "Room"        ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Reservation" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
ALTER TABLE "Charge"      ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

ALTER TABLE "Room"        ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "Reservation" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "Room"        ALTER COLUMN "amenities" SET DEFAULT '{}';

DO $$ BEGIN
  ALTER TABLE "Reservation"
    ADD CONSTRAINT "Reservation_dates_check" CHECK ("checkOut" > "checkIn");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
