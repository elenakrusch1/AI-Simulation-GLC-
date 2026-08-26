import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Data Center Deal Simulation",
  description: "Round-based data center business simulation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
