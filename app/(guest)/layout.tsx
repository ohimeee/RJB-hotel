import Navbar from "@/components/guest/Navbar";

const GuestLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <>
      <Navbar />

      <main className="min-h-screen mx-30 mb-8">
        {children}
      </main>

    </>
  );
}

export default GuestLayout;