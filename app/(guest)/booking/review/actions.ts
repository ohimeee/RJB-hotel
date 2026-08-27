"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { DATE_PATTERN, nights, today } from "@/lib/dates";
import { createInvoice } from "@/lib/payments";
import {
  createReservation,
  releaseHold,
  type BookingError,
} from "@/lib/reservations";
import { getRoom, typeLabel } from "@/lib/rooms";
import { MAX_GUESTS, MIN_GUESTS } from "@/lib/search";

/** Nobody books a year in a single reservation, and an open-ended stay is a bug. */
const MAX_NIGHTS = 30;

/**
 * A server action is a public endpoint — the form it is attached to is not a
 * gate. Everything below arrives as untrusted input, including the room id and
 * the dates, so all of it is validated here rather than in the component.
 *
 * The price is deliberately absent: it is recomputed from the room's stored
 * rate in createReservation(). A total posted by the client is never trusted.
 */
const bookingSchema = z
  .object({
    roomId: z.string().min(1, "Pick a room first."),
    guestName: z
      .string()
      .trim()
      .min(1, "Enter the name the reservation is held under.")
      .max(120, "That name is too long."),
    guestCount: z.coerce
      .number()
      .int()
      .min(MIN_GUESTS, "At least one guest.")
      .max(MAX_GUESTS, `We can seat at most ${MAX_GUESTS} guests in a room.`),
    checkIn: z.string().regex(DATE_PATTERN, "Check-in date is missing."),
    checkOut: z.string().regex(DATE_PATTERN, "Check-out date is missing."),
  })
  .refine((value) => value.checkOut > value.checkIn, {
    message: "Check-out has to be after check-in.",
    path: ["checkOut"],
  })
  // `YYYY-MM-DD` compares correctly as a string, so this needs no Date object
  // and therefore has no timezone behaviour. See lib/dates.ts.
  .refine((value) => value.checkIn >= today(), {
    message: "That check-in date has already passed.",
    path: ["checkIn"],
  })
  .refine((value) => nights(value.checkIn, value.checkOut) <= MAX_NIGHTS, {
    message: `Stays are capped at ${MAX_NIGHTS} nights — call the front desk for longer.`,
    path: ["checkOut"],
  });

/** What the form renders back to the guest when something is wrong. */
export type BookingState = { error?: string };

const BOOKING_ERRORS: Record<BookingError, string> = {
  ROOM_NOT_FOUND: "That room is no longer listed.",
  OVER_CAPACITY: "That room does not sleep that many guests.",
  ROOM_TAKEN:
    "Someone booked that room while you were deciding. Try different dates, or pick another room.",
  CODE_EXHAUSTED:
    "We could not generate a confirmation code. Please try again.",
};

/**
 * Hold the room, open a hosted checkout, and send the guest to it.
 *
 * The reservation is written before the money moves — see createReservation().
 * Nothing here confirms anything: the booking stays PENDING until Xendit's
 * webhook says it was paid.
 */
export const startBooking = async (
  _previous: BookingState,
  formData: FormData,
): Promise<BookingState> => {
  const parsed = bookingSchema.safeParse({
    roomId: formData.get("roomId"),
    guestName: formData.get("guestName"),
    guestCount: formData.get("guestCount"),
    checkIn: formData.get("checkIn"),
    checkOut: formData.get("checkOut"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const { roomId, guestName, guestCount, checkIn, checkOut } = parsed.data;

  const room = await getRoom(roomId);

  if (!room) return { error: BOOKING_ERRORS.ROOM_NOT_FOUND };

  const result = await createReservation({
    roomId,
    guestName,
    guestCount,
    checkIn,
    checkOut,
  });

  if (!result.ok) return { error: BOOKING_ERRORS[result.error] };

  const { reservation, quote } = result;

  let invoiceUrl: string;

  try {
    invoiceUrl = await createInvoice({
      reservationId: reservation.id,
      confirmationCode: reservation.confirmationCode,
      amount: reservation.totalAmount,
      description: `${room.name} (Room ${room.number}, ${typeLabel(room.type)}) — ${quote.nights} ${
        quote.nights === 1 ? "night" : "nights"
      }`,
    });
  } catch (error) {
    // The hold is already in the database. Leaving it there would block the
    // room for the full window over a failure the guest had no part in, so it
    // is released immediately rather than waiting for the sweep.
    console.error("[booking] invoice creation failed", error);

    await releaseHold(reservation.id);

    return {
      error: "We could not reach the payment provider. Please try again.",
    };
  }

  // The room is now held, so the catalog has one fewer room for these dates.
  revalidatePath("/");

  // Off to Xendit's hosted page. redirect() throws, so nothing runs after it.
  redirect(invoiceUrl);
};
