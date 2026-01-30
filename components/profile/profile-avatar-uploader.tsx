"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useUploadFile } from "@convex-dev/r2/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAvatarUrl, toR2ImageString } from "@/lib/use-avatar-url";

interface ProfileAvatarUploaderProps {
  name: string | null | undefined;
  image: string | null | undefined;
  email: string | null | undefined;
}

export function ProfileAvatarUploader({
  name,
  image,
  email,
}: ProfileAvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFile = useUploadFile(api.r2);
  const router = useRouter();

  // Resolve the avatar URL (handles both R2 keys and external URLs)
  const resolvedAvatarUrl = useAvatarUrl(image);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.slice(0, 2).toUpperCase() || "U";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to R2 and get the storage key
      const key = await uploadFile(file);

      // 2. Store the R2 key (not the URL) in the user profile
      // Prefix with "r2:" so we can distinguish from external URLs (Discord, etc.)
      await authClient.updateUser({
        image: toR2ImageString(key),
      });

      toast.success("Profile picture updated");
      router.refresh();
    } catch (error) {
      console.error("Failed to upload avatar", error);
      toast.error("Failed to update profile picture");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative group">
      <Avatar className="h-32 w-32 border-4 border-card shadow-xl cursor-pointer">
        <AvatarImage
          src={resolvedAvatarUrl}
          alt={name || ""}
          className={cn(isUploading && "opacity-50")}
        />
        <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Hover Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white",
          isUploading && "opacity-100 cursor-not-allowed",
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <>
            <Camera className="h-8 w-8 mb-1" />
            <span className="text-xs font-medium">Change</span>
          </>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
}
