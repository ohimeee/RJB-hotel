import { notFound } from "next/navigation";

import NavLink from "@/components/guest/NavLink";
import StayDetails from "@/components/guest/StayDetails";
import GuestDetails from "@/components/guest/GuestDetails";
import BookingCard from "@/components/guest/BookingCard";
import { addDays, nights, today } from "@/lib/dates";
import { getRoom } from "@/lib/rooms";
import { quoteStay } from "@/lib/pricing";
import { parseSearch, type RawSearchParams } from "@/lib/search";

type CheckoutParams = RawSearchParams & { room?: string | string[] };

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const BookingsPage = async ({
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

  // The catalog can be browsed without dates today, since the search bar is
  // still static. Default to one night starting today so checkout always has a
  // real stay to price; once the bar posts dates, they arrive in the URL.
  const query = parseSearch(raw);
  const checkIn = query.checkIn ?? today();
  const checkOut = query.checkOut ?? addDays(checkIn, 1);

  const quote = quoteStay(room.nightlyRate, nights(checkIn, checkOut));

  return (
    <div className="flex-col">
      <div className="relative border-b-2 py-5">
        <p className="text-xs font-medium text-orange-500">
          RESERVATION CHEKOUT
        </p>
        <h1 className="text-4xl font-bold">Review & confirm</h1>
        <NavLink
          href="/"
          className="absolute right-0 bottom-0 mb-5 font-bold tracking-tighter"
          activeClassName="text-orange-500"
          inactiveClassName="text-orange-500 hover:text-orange-300"
        >
          {"<"} Back to room
        </NavLink>
      </div>
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
    </div>
  );
};

export default BookingsPage;
