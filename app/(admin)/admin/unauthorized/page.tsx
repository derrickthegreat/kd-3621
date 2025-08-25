"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function UnauthorizedPage() {
  const router = useRouter()
  const [count, setCount] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => setCount((c) => (c > 0 ? c - 1 : 0)), 1000)
    const timeout = setTimeout(() => router.replace("/"), 5000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-2">Unauthorized</h1>
        <p className="text-muted-foreground mb-4">You don't have access to the Admin panel.</p>
        <p className="text-sm text-muted-foreground mb-6">Redirecting in {count}s…</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.replace("/")}
            className="inline-flex h-9 items-center rounded-md bg-orange-600 px-3 text-sm font-medium text-white hover:bg-orange-500"
          >
            Go home now
          </button>
          <Link href="/sign-in" className="text-sm underline">
            Sign in as admin
          </Link>
        </div>
      </div>
    </div>
  )
}
