"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) router.replace("/login");
  }, [isSignedIn, router]);

  // Placeholder for a future personal dashboard (activity, linked governors, etc.)
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-2xl font-semibold text-orange-400 mb-2">My Account</h1>
      <p className="text-sm text-gray-300">Your personal dashboard is coming soon.</p>
    </div>
  );
}
