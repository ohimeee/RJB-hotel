import NavLink from "@/components/guest/NavLink";
import StayDetails from "@/components/guest/StayDetails";
import GuestDetails from "@/components/guest/GuestDetails";
import BookingCard from "@/components/guest/BookingCard";

const BookingsPage = () => {
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
          <StayDetails />
          <GuestDetails />
        </div>
        <div className="flex-1">
          <BookingCard />
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
