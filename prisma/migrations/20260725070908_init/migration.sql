-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('STANDARD', 'DELUXE', 'SUITE');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "RoomType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "amenities" TEXT[],
    "nightlyRate" DECIMAL(10,2) NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number");

-- CreateIndex
CREATE INDEX "Reservation_roomId_checkIn_checkOut_idx" ON "Reservation"("roomId", "checkIn", "checkOut");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
