"use client";

import { Button } from "@/components/ui/button";
import AeroHubText from "@/public/LogoText.svg";
import AeroHubIcon from "@/public/LogoIcon.svg";
import { Menu, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { AuthButton } from "@/components/auth";

function DesktopNavbar() {
  return (
    <div className="hidden md:flex items-center justify-between fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl h-16 py-4 px-12 md:px-24 lg:px-48">
      {/* Left */}
      <div className="flex items-center h-full w-auto gap-x-2">
        <Link href="/" className="h-full w-auto">
          <AeroHubText className="fill-foreground h-full w-auto py-2 pr-4" />
        </Link>
        <Button variant={"link"}>Liveries</Button>
        <Button variant={"link"}>About</Button>
      </div>

      {/* Center */}
      <div className="relative flex items-center h-full w-full mx-4 max-w-96">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Looking for something?"
          className="pl-10"
        />
      </div>

      {/* Right */}
      <div className="flex items-center h-full w-auto gap-x-4">
        <Button variant={"default"}>Post</Button>
        <AuthButton />
      </div>
    </div>
  );
}

function MobileNavbar() {
  return (
    <Sheet>
      <div className="flex md:hidden items-center justify-between fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl h-16 py-4 px-4">
        {/* Left */}
        <div className="flex items-center h-full w-auto gap-x-2">
          <Link href="/" className="h-full w-auto">
            <AeroHubIcon className="fill-foreground h-full w-auto" />
          </Link>
        </div>

        {/* Center */}
        <div className="relative flex items-center h-full w-full mx-4 max-w-96">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Looking for something?"
            className="pl-10"
          />
        </div>

        {/* Right */}
        <div className="flex items-center h-full w-auto gap-x-4">
          <SheetTrigger asChild>
            <Menu size={32} />
          </SheetTrigger>
        </div>
      </div>

      <SheetContent className="px-12">
        <SheetHeader>
          <SheetTitle />
          <AeroHubText className="fill-foreground w-auto h-6" />
        </SheetHeader>
        <Button variant={"default"}>Post</Button>
        <AuthButton />
        <Separator />
        <Button variant={"link"}>Liveries</Button>
        <Button variant={"link"}>About</Button>
      </SheetContent>
    </Sheet>
  );
}

export default function Navbar() {
  return (
    <>
      <DesktopNavbar />
      <MobileNavbar />
    </>
  );
}
