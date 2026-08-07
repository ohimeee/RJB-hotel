import { Search } from "lucide-react";

const SearchBar = () => {
  return (
    <div className="my-5 flex divide-x-2 divide-gray-400 border-2 border-gray-400">
      <div className="flex-3 p-3">
        <p className="text-xs">Check-in</p>
        <p className="font-bold">05/05/2007</p>
      </div>
      <div className="flex-3 p-3">
        <p className="text-xs">Check-out</p>
        <p className="font-bold">05/06/2007</p>
      </div>
      <div className="flex-3 p-3">
        <p className="text-xs">Guests</p>
        <p className="font-bold">1 guest</p>
      </div>
      <div className="flex flex-1 items-center justify-center gap-1 bg-orange-500 px-2 py-5 text-sm font-bold tracking-wider text-white">
        Search
        <Search className="size-3.5" />
      </div>
    </div>
  );
};

export default SearchBar;
