import InfoBar from "@/components/guest/InfoBar";
import RoomCard from "@/components/guest/RoomCard";
import { findAvailableRooms } from "@/lib/rooms";
import { checkoutHref, parseSearch, type RawSearchParams } from "@/lib/search";

const HomePage = async ({
  searchParams,
}: {
  // Next 16 hands searchParams over as a Promise.
  searchParams: Promise<RawSearchParams>;
}) => {
  const query = parseSearch(await searchParams);
  const rooms: RoomCardData[] = [
    {
      id: "mock-deluxe-101",
      number: "101",
      name: "Garden Deluxe",
      type: "DELUXE",
      capacity: 2,
      amenities: ["King bed", "Garden view", "Wi-Fi"],
      description: "A calm, light-filled room overlooking the garden.",
      imageUrl: "https://picsum.photos/seed/garden-deluxe/800/600",
      status: "AVAILABLE",
      nightlyRate: "4500.00",
      nightlyRateLabel: "₱4,500",
    },
    {
      id: "mock-suite-201",
      number: "201",
      name: "Sunset Suite",
      type: "SUITE",
      capacity: 4,
      amenities: ["King bed", "Living room", "Breakfast"],
      description: "A spacious suite designed for slow, comfortable stays.",
      imageUrl: "https://picsum.photos/seed/sunset-suite/800/600",
      status: "AVAILABLE",
      nightlyRate: "6800.00",
      nightlyRateLabel: "₱6,800",
    },
    {
      id: "mock-standard-301",
      number: "301",
      name: "Quiet Standard",
      type: "STANDARD",
      capacity: 2,
      amenities: ["Queen bed", "Work desk", "Wi-Fi"],
      description: "A comfortable retreat for restful nights and easy mornings.",
      imageUrl: "https://picsum.photos/seed/quiet-standard/800/600",
      status: "AVAILABLE",
      nightlyRate: "3200.00",
      nightlyRateLabel: "₱3,200",
    },
  ];

  const searched = Boolean(query.checkIn && query.checkOut);

  return (
    <div className="flex-col">
      <div className="border-b-2 py-5">
        <p className="text-xs font-medium text-orange-500">BOUTIQUE STAYS</p>
        <h1 className="text-4xl font-bold">Rooms & suites</h1>
      </div>

      <InfoBar />

      {rooms.length === 0 ? (
        <p className="py-10 text-gray-500">
          {searched
            ? "No rooms free for those dates. Try shortening your stay or lowering the guest count."
            : "No rooms have been added yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              href={checkoutHref(room.id, query)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
