import type { Metadata } from "next";
import "./globals.css";
import { geist } from "@/app/ui/fonts";
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
      <body className={`${geist.className} antialiased mx-4 lg:mx-96`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <NavBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
