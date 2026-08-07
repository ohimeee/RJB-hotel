import SearchBar from "@/components/guest/SearchBar";

const HomePage = () => {
  return (
    <div className="flex-col">
      <div className="border-b-2 py-5">
        <p className="text-xs font-medium text-orange-500">BOUTIQUE STAYS</p>
        <h1 className="text-4xl font-bold">Rooms & suites</h1>
      </div>

      <SearchBar />
    </div>
  );
};

export default HomePage;
