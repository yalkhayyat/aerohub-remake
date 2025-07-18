import type { Metadata } from "next";
import "./globals.css";
import { FunnelSans } from "@/app/ui/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import NavBar from "@/app/ui/navbar";
import Footer from "@/app/ui/footer";

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
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
