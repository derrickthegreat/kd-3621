"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatusMessage from "@/components/ui/status-message";

function ResetPasswordContent() {
  const router = useRouter();
  const qp = useSearchParams();
  const emailFromQuery = qp.get("email") || "";
  const { isLoaded, signIn } = useSignIn();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailFromQuery && !email) setEmail(emailFromQuery);
  }, [emailFromQuery, email]);

  if (isSignedIn) {
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
      const res = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });
      if (res.status === "needs_second_factor") {
        setInfo("Additional verification required");
      } else if (res.status === "complete") {
        // password reset complete; route to login
        setInfo("Password reset. You can sign in now.");
        router.replace("/login");
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-semibold text-orange-400 mb-2">Reset your password</h1>
        <p className="text-sm text-gray-300 mb-6">Enter the code we sent and your new password.</p>
        {error && <StatusMessage message={error} isError />}
        {info && <StatusMessage message={info} isError={false} />}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"/>
          </div>
          <div>
            <Label htmlFor="code">Verification code</Label>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="123456"/>
          </div>
          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500">
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center px-4"><div className="w-full max-w-md p-6">Loading…</div></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
