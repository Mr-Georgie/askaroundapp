"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "@/context/AuthProvider";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Header() {
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between h-16 px-4 max-w-5xl mx-auto">
        <Link href="/" className="text-xl font-bold text-primary">
          AskAroundApp
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer transition-transform hover:scale-110">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
