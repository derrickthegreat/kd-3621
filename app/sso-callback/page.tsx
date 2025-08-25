"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SsoCallback() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const t = await fetch("/api/auth/redirect-target").then(r => r.json());
        router.replace(t?.target || "/");
      } finally {
        setDone(true);
      }
    })();
  }, [router]);
  return done ? null : null;
}
