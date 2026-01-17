"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogIn, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/"); // Redirect to home on success
    } catch (error) {
      console.error("Error signing in with Google", error);
      toast({
        title: "Login Failed",
        description: "Could not sign you in. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto flex items-center min-h-[60vh]">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle>Welcome to AskAround</CardTitle>
          <CardDescription>
            Please agree to the terms to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-0.5"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="terms"
                className="text-sm font-normal text-muted-foreground"
              >
                I have read and agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="underline hover:text-primary"
                >
                  Terms and Conditions
                </Link>
                .
              </Label>
              <p className="text-xs text-muted-foreground">
                Learn more about our community on the{" "}
                <Link
                  href="/about"
                  target="_blank"
                  className="underline hover:text-primary"
                >
                  About page
                </Link>
                .
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSignIn}
            disabled={!agreed || loading}
            className="w-full"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
            Sign In with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
