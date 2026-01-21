import type { Metadata } from "next";
import "./globals.css";
import { FunnelSans } from "@/app/ui/fonts";
import { ThemeProvider } from "@/components/theme-provider";
import NavBar from "@/app/ui/navbar";
import Footer from "@/app/ui/footer";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";

export const metadata: Metadata = {
  title: "Aeronautica Liveries",
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
          <ClerkProvider>
            <ConvexClientProvider>
              <NavBar />
              {children}
              <Footer />
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
