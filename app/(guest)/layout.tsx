import Navbar from "@/components/guest/Navbar";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />

      <main className="min-h-screen p-10">
        {children}
      </main>

    </>
  );
}