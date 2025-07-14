import { Button } from "@/components/ui/button";
import AeroHubText from "@/public/LogoText.svg";

export default function Navbar() {
  return (
    <div className="flex h-6 my-6 items-center justify-between">
      {/* Left */}
      <div className="flex items-center h-full w-auto gap-x-8">
        <AeroHubText className="fill-foreground h-full w-auto p-1" />
        <Button variant={"ghost"}>Liveries</Button>
        <Button variant={"ghost"}>About</Button>
      </div>

      {/* Right */}
      <div className="flex items-center h-full w-auto gap-x-4">
        <Button variant={"outline"}>Post</Button>
        <Button variant={"default"}>Sign In</Button>
      </div>
    </div>
  );
}
