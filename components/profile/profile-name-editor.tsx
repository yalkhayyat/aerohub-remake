"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileNameEditorProps {
  name: string;
}

export function ProfileNameEditor({
  name: initialName,
}: ProfileNameEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (name === initialName) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await authClient.updateUser({
        name: name.trim(),
      });
      toast.success("Name updated");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update name", error);
      toast.error("Failed to update name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(initialName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 max-w-sm">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-9 font-bold text-xl md:text-2xl px-2 py-0"
          placeholder="Enter display name"
          disabled={isSaving}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <h1 className="text-3xl font-bold">{initialName}</h1>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
