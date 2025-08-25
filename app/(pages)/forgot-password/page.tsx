"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusMessage from "@/components/ui/status-message";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (isSignedIn) {
    // already signed in; send to callback to route by role
    router.replace("/sso-callback");
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await signIn.create({ strategy: "reset_password_email_code", identifier: email });
      setInfo("We sent a verification code to your email.");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      setError(e?.errors?.[0]?.message || "Failed to start password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-semibold text-orange-400 mb-2">Forgot your password?</h1>
        <p className="text-sm text-gray-300 mb-6">Enter your email to receive a verification code.</p>
        {error && <StatusMessage message={error} isError />}
        {info && <StatusMessage message={info} isError={false} />}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"/>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500">
            {loading ? "Sending..." : "Send code"}
          </Button>
        </form>
      </div>
    </div>
  );
}
