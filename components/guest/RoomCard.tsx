import { UserRound } from "lucide-react";
import { MoveRight } from "lucide-react";

const RoomCard = () => {
  return (
    <div className="relative flex aspect-6/5 w-full flex-col">
      <div className="absolute top-0 left-0 bg-orange-500 p-2 text-xs font-semibold tracking-widest text-white">
        Suite
      </div>
      <div className="h-1/2 overflow-hidden">
        <img
          className="h-full w-full object-cover"
          src="https://picsum.photos/200"
          alt="random_pic"
        />
      </div>
      <div className="flex-col space-y-2 bg-gray-200 p-3">
        <span className="text-lg font-bold">The Garret Suite</span>
        <div className="flex items-center gap-2">
          <UserRound className="size-3" />
          <span className="text-xs text-gray-500">Sleeps 2</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* use map here*/}
          <span className="bg-white px-2 py-1 text-xs">King Bed</span>
          <span className="bg-white px-2 py-1 text-xs">King Bed</span>
          <span className="bg-white px-2 py-1 text-xs">King Bed</span>
          <span className="bg-white px-2 py-1 text-xs">King Bed</span>
        </div>
        <div className="flex items-center justify-between border-t-2">
          <div>
            <p className="text-xl font-bold">P8,900</p>
            <p className="text-xs text-gray-500">per night</p>
          </div>
          <div className="flex items-center gap-1 bg-orange-500 p-2 text-xs font-semibold tracking-widest text-white">
            <span>Book Now</span>
            <MoveRight className="size-3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
