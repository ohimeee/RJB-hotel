import Link from "next/link";

const Sidebar = () => {
  return (
    <aside className="min-h-screen w-64 bg-gray-900 p-5 text-white">
      <h2 className="mb-8 text-2xl font-bold">Admin</h2>

      <div className="flex flex-col gap-4">
        <Link href="/admin">Dashboard</Link>

        <Link href="/admin/rooms">Rooms</Link>

        <Link href="/admin/reservations">Reservations</Link>
      </div>
    </aside>
  );
};

export default Sidebar;
