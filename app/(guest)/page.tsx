import SearchBar from "@/components/guest/InfoBar";
import RoomCard from "@/components/guest/RoomCard";

const HomePage = () => {
  return (
    <div className="flex-col">
      <div className="border-b-2 py-5">
        <p className="text-xs font-medium text-orange-500">BOUTIQUE STAYS</p>
        <h1 className="text-4xl font-bold">Rooms & suites</h1>
      </div>

      <SearchBar />
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* use map here*/}
        <RoomCard/>
        <RoomCard/>
        <RoomCard/>
        <RoomCard/>
        <RoomCard/>
        <RoomCard/>
      </div>
    </div>
  );
};

export default HomePage;
