"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProfileLiveryList } from "@/components/profile/profile-livery-list";
import { ProfileAvatarUploader } from "@/components/profile/profile-avatar-uploader";
import { ProfileNameEditor } from "@/components/profile/profile-name-editor";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?redirect=/profile");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  const user = session.user;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-24 lg:px-48">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-16">
        <ProfileAvatarUploader
          name={user.name}
          image={user.image}
          email={user.email}
        />

        <div className="flex flex-col items-center md:items-start gap-1 flex-1 py-2">
          {/* Editor handles name + editing UI internally */}
          <ProfileNameEditor name={user.name || "User"} />
          <p className="text-muted-foreground text-lg">{user.email}</p>

          <div className="flex gap-2 mt-6">
            <Button size="default" className="rounded-full px-6" asChild>
              <Link href="/liveries/create">Create New Post</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="my-liveries" className="w-full">
        <div className="flex justify-center md:justify-start mb-8">
          <TabsList className="h-12 p-thin bg-muted/30 backdrop-blur-sm border border-border/50 rounded-full">
            <TabsTrigger
              value="my-liveries"
              className="rounded-full px-8 py-2 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              My Liveries
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="rounded-full px-8 py-2 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all"
            >
              Saved
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="my-liveries"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <ProfileLiveryList
            authorId={user.id}
            emptyMessage="You haven't uploaded any liveries yet."
          />
        </TabsContent>

        <TabsContent
          value="saved"
          className="mt-0 focus-visible:outline-none focus-visible:ring-0"
        >
          <ProfileLiveryList
            favoritesUserId={user.id}
            emptyMessage="You haven't saved any liveries yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
