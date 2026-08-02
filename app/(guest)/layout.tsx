import Navbar from "@/components/guest/Navbar";

const GuestLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <>
      <Navbar />

      <main className="min-h-screen p-10">
        {children}
      </main>

    </>
  );
}

export default GuestLayout;