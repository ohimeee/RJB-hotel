import "./globals.css";

export const metadata = {
  title: "InnKeep Express",
  description: "Hotel Reservation System",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;