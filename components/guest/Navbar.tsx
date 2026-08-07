import NavLink from "@/components/guest/NavLink";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center bg-white border-b px-8 py-2 text-black">
      <h1 className="text-lg font-bold tracking-tight">
        InnKeep Express
      </h1>

      <div className="flex gap-6 text-sm">
        <NavLink href="/">Rooms</NavLink>

        <NavLink href="/my-bookings">My Bookings</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;