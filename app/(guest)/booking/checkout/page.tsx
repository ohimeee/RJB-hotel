import { notFound } from "next/navigation";

import NavLink from "@/components/NavLink";
import StayDetails from "@/components/guest/StayDetails";
import GuestDetails from "@/components/guest/GuestDetails";
import BookingCard from "@/components/guest/BookingCard";
import BookingForm from "@/components/guest/BookingForm";
import { addDays, nights, today } from "@/lib/dates";
import { getRoom } from "@/lib/rooms";
import { quoteStay } from "@/lib/pricing";
import { parseSearch, type RawSearchParams } from "@/lib/search";

type CheckoutParams = RawSearchParams & { room?: string | string[] };

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const BookingReviewPage = async ({
  searchParams,
}: {
  searchParams: Promise<CheckoutParams>;
}) => {
  const raw = await searchParams;
  const roomId = first(raw.room);
  const room = roomId ? await getRoom(roomId) : null;

  // No room in the URL, or an id that no longer exists — there is nothing to
  // review, so this is a 404 rather than a page of blanks.
  if (!room) notFound();

  // The catalog can be browsed without dates, so default to one night starting
  // today. The same dates go into the hidden inputs the action reads, which is
  // why the page and the reservation cannot disagree about the stay.
  const query = parseSearch(raw);
  const checkIn = query.checkIn ?? today();
  const checkOut = query.checkOut ?? addDays(checkIn, 1);

  // Display only. The action recomputes this from the stored rate before it
  // writes anything or asks Xendit for a peso amount.
  const quote = quoteStay(room.nightlyRate, nights(checkIn, checkOut));

  return (
    <div className="flex-col">
      <div className="relative border-b-2 py-5">
        <p className="text-xs font-medium text-orange-500">
          RESERVATION CHECKOUT
        </p>
        <h1 className="text-4xl font-bold">Review &amp; confirm</h1>
        <NavLink
          href="/"
          className="absolute right-0 bottom-0 mb-5 font-bold tracking-tighter"
          activeClassName="text-orange-500"
          inactiveClassName="text-orange-500 hover:text-orange-300"
        >
          {"<"} Back to rooms
        </NavLink>
      </div>

      <BookingForm
        roomId={room.id}
        checkIn={checkIn}
        checkOut={checkOut}
        guestCount={query.guests}
      >
        <div className="flex gap-8">
          <div className="flex-2 flex-col">
            <StayDetails
              checkIn={checkIn}
              checkOut={checkOut}
              nights={quote.nights}
            />
            <GuestDetails />
          </div>
          <div className="flex-1">
            <BookingCard room={room} quote={quote} />
          </div>
        </div>
      </BookingForm>
    </div>
  );
};

export default BookingReviewPage;
