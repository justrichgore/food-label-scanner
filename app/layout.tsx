import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // proper import for Outfit
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Food Label Scanner",
  description: "Reveal hidden health risks in your food ingredients.",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} antialiased font-sans flex min-h-screen bg-slate-50`}
      >
        <Sidebar />
        <main className="flex-1 relative overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
