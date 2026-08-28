import Navbar from "@/components/guest/GuestNavbar";

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