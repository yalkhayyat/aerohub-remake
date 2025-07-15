import type { Metadata } from "next";
import "./globals.css";
import { FunnelSans } from "@/app/ui/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import NavBar from "@/app/ui/navbar";

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${FunnelSans.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <NavBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
