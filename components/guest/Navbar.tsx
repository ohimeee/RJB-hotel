import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between bg-white border-b px-8 py-4 text-black">
      <h1 className="text-sm">
        InnKeep Express
      </h1>

      <div className="flex gap-6 text-sm">
        <Link href="/">Rooms</Link>

        <Link href="/my-bookings">My Bookings</Link>
      </div>
    </nav>
  );
}