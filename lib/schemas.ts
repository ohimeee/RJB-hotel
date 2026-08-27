import { z } from "zod";

import { DATE_PATTERN, nights, today } from "@/lib/dates";
import { MAX_GUESTS, MIN_GUESTS } from "@/lib/search";

/**
 * Every schema that guards a write, in one file.
 *
 * They used to sit next to the code that used them, which meant the rules for a
 * booking were only visible from inside the booking action. Collected here, the
 * whole set of things this API will accept can be read in one pass — and a
 * route and a server action validating the same thing can share one schema
 * instead of drifting apart.
 *
 * Read-side query parsing is deliberately *not* here. `parseSearch` in
 * lib/search.ts normalises a malformed URL into the full catalog rather than
 * rejecting it, which is the opposite job: a bad `?guests=abc` should show
 * rooms, not an error page.
 */

/** Nobody books a year in a single reservation, and an open-ended stay is a bug. */
export const MAX_NIGHTS = 30;

/**
 * A server action is a public endpoint — the form it is attached to is not a
 * gate. Everything below arrives as untrusted input, including the room id and
 * the dates.
 *
 * The price is deliberately absent: it is recomputed from the room's stored
 * rate in createReservation(). A total posted by the client is never trusted.
 */
export const bookingSchema = z
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

export type BookingInput = z.infer<typeof bookingSchema>;
