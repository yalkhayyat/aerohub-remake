"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInWithGoogle } from "@/components/auth/SignInWithGoogle";
import { UserButton } from "@/components/auth/UserButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface SignInDialogProps {
  children: React.ReactNode;
}

export function SignInDialog({ children }: SignInDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Welcome back
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to your account to continue
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <SignInWithGoogle />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Email sign-in coming soon
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AuthButtonProps {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "link"
    | "destructive";
}

export function AuthButton({ variant = "secondary" }: AuthButtonProps) {
  return (
    <>
      <AuthLoading>
        <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
      </AuthLoading>
      <Unauthenticated>
        <SignInDialog>
          <Button variant={variant}>Sign In</Button>
        </SignInDialog>
      </Unauthenticated>
      <Authenticated>
        <UserButton />
      </Authenticated>
    </>
  );
}
