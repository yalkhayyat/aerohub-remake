import { Button } from "@/components/ui/button";
import AeroHubText from "@/public/LogoText.svg";
import AeroHubIcon from "@/public/LogoIcon.svg";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

function DesktopNavbar() {
  return (
    <div className="hidden md:flex items-center justify-between fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl h-16 py-4 px-12 md:px-48">
      {/* Left */}
      <div className="flex items-center h-full w-auto gap-x-2">
        <AeroHubText className="fill-foreground h-full w-auto py-2 pr-4" />
        <Button variant={"link"}>Liveries</Button>
        <Button variant={"link"}>About</Button>
      </div>

      {/* Right */}
      <div className="flex items-center h-full w-auto gap-x-4">
        <Button variant={"default"}>Post</Button>
        <Button variant={"outline"}>Sign In</Button>
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
          <AeroHubIcon className="fill-foreground h-full w-auto" />
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
        <Button variant={"outline"}>Sign In</Button>
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
