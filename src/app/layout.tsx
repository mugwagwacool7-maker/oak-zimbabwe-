import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Registration Complete - Oak Foundation Partner Convening 2026",
  description: "Oak Foundation Partner Convening 2026 Registration Confirmation and Entry Pass",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${plusJakarta.className} h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}
