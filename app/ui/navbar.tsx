"use client";

import { Button } from "@/components/ui/button";
import AeroHubText from "@/public/LogoText.svg";
import AeroHubIcon from "@/public/LogoIcon.svg";
import { LogOut, Menu, Search, User } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
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
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function PostButton() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <Button variant="default" disabled>
        Post
      </Button>
    );
  }

  const href = session
    ? "/liveries/create"
    : "/login?redirect=/liveries/create";

  return (
    <Button variant="default" asChild>
      <Link href={href}>Post</Link>
    </Button>
  );
}

function DesktopNavbar() {
  return (
    <div className="hidden md:flex items-center justify-between fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl h-16 py-4 px-12 md:px-24 lg:px-48">
      {/* Left */}
      <div className="flex items-center h-full w-auto gap-x-2">
        <Link href="/" className="h-full w-auto">
          <AeroHubText className="fill-foreground h-full w-auto py-2 pr-4" />
        </Link>
        <Button variant={"link"} asChild>
          <Link href="/liveries">Liveries</Link>
        </Button>
        <Button variant={"link"} asChild>
          <Link href="/about">About</Link>
        </Button>
      </div>

      {/* Center */}
      {/* <div className="relative flex items-center h-full w-full mx-4 max-w-96">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Looking for something?"
          className="pl-10"
        />
      </div> */}

      {/* Right */}
      <div className="flex items-center h-full w-auto gap-x-4">
        <PostButton />
        <UserMenu />
      </div>
    </div>
  );
}

function MobileNavbar() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

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
        {/* <div className="relative flex items-center h-full w-full mx-4 max-w-96">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Looking for something?"
            className="pl-10"
          />
        </div> */}

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
        <PostButton />
        {isPending ? (
          <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
        ) : session?.user ? (
          <>
            <div className="flex items-center gap-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session.user.image || undefined}
                  alt={session.user.name || ""}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {session.user.name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{session.user.name}</span>
            </div>
            <Button
              variant="destructive"
              className="text-red-400"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </>
        ) : (
          <Button variant={"secondary"} asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        )}
        <Separator />
        <Button variant={"link"} asChild>
          <Link href="/liveries">Liveries</Link>
        </Button>
        <Button variant={"link"} asChild>
          <Link href="/about">About</Link>
        </Button>
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
