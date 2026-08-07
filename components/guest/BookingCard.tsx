import { MoveRight } from "lucide-react";

const BookingCard = () => {
  return (
    <div className="mt-5 flex w-full flex-col">
      <div className="aspect-2/1 overflow-hidden">
        <img
          className="h-full w-full object-cover"
          src="https://picsum.photos/200"
          alt="random_pic"
        />
      </div>

      <div className="flex-col divide-y-2 divide-black bg-gray-200 p-3">
        <div className="flex flex-col">
          <p className="text-xs font-semibold text-orange-500">
            BOUTIQUE KING | ROOM 402
          </p>
          <div className="flex items-center justify-between pb-5">
            <div>
              <p className="text-2xl font-bold">The Garret Suite</p>
              <p className="text-xs text-gray-500">
                King bed | Top floor | Sleeps 2
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">$245.00</p>
              <p className="text-xs text-gray-500">per night</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col py-5">
          <p className="mb-5 text-xs font-semibold tracking-widest text-gray-500">
            PRICE BREAKDOWN
          </p>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p>Room rate</p>
              <p className="text-xs text-gray-500">$245.00 x 3 nights</p>
            </div>
            <div>
              <p className="text-lg font-bold">$245.00</p>
              <p className="text-xs text-gray-500">per night</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Taxes & fees {"(12%)"}</span>
            <span className="text-lg font-bold">$245.00</span>
          </div>
        </div>
        <div className="flex flex-col py-5">
          <p className="text-xl font-bold">Total</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Incl. taxes & fees | USD
            </span>
            <span className="text-3xl font-bold text-orange-500">$823.20</span>
          </div>
        </div>
        <div className="my-5 flex items-center justify-between bg-orange-500 p-5 font-bold text-white">
          <span>Confirm reservation</span>
          <MoveRight className="size-5" />
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
