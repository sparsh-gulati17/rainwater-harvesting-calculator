import "./globals.css";

export const metadata = {
  title: "Rainova — Rainwater Harvesting Calculator",
  description: "A scroll-driven camera through live type",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}