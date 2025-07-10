import type { Metadata } from "next";
import "./globals.css";
import { geist } from "@/app/ui/fonts";

export const metadata: Metadata = {
  title: "Aerohub",
  description: "Liveries for Aeronautica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>{children}</body>
    </html>
  );
}
