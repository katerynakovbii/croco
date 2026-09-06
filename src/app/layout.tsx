import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crocodile Dentist",
  description: "Take turns pressing teeth. Don't wake the croc!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
