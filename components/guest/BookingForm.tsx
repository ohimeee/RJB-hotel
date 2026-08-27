"use client";

import { useActionState } from "react";

import {
  startBooking,
  type BookingState,
} from "@/app/(guest)/booking/review/actions";

/**
 * Wraps the checkout page in the form that posts to `startBooking`.
 *
 * The stay itself travels as hidden inputs rather than component state: the
 * dates and room arrived in the URL, and the action re-validates and re-prices
 * everything server-side anyway, so there is nothing here worth holding in
 * React. The only field a guest actually types is the name, inside GuestDetails.
 */
const BookingForm = ({
  roomId,
  checkIn,
  checkOut,
  guestCount,
  children,
}: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  children: React.ReactNode;
}) => {
  const [state, formAction] = useActionState<BookingState, FormData>(
    startBooking,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col">
      <input type="hidden" name="roomId" value={roomId} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <input type="hidden" name="guestCount" value={guestCount} />

      {children}

      {state.error ? (
        <p
          role="alert"
          className="mb-8 border-2 border-orange-500 bg-orange-50 p-3 text-sm text-orange-700"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
};

export default BookingForm;
