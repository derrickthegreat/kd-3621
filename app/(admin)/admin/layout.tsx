import { ReactNode } from "react"
import { ClerkProvider } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { AppContent } from "./(components)/layout/AppContent"
import { AppLayout } from "./(components)/layout/AppLayout"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prismaUtils"

export default async function Layout({ children }: { children: ReactNode }) {
  // Server-side guard: only admins may access /admin
  const user = await currentUser().catch(() => null)
  const clerkId = user?.id
  const isOverride = (process.env.ADMIN_OVERRIDE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(clerkId || "")

  let dbRole: string | null = null
  let dbDown = false
  if (clerkId) {
    try {
      const appUser = await prisma.user.findUnique({ where: { clerkId }, select: { role: true } })
      dbRole = appUser?.role ?? null
    } catch (e: any) {
      // Prisma P1001: database unreachable
      if (e?.code === 'P1001') dbDown = true
      else throw e
    }
  }

  // Allowed roles for admin area (from DB only; if DB is down, allow override as emergency access)
  const allowed = new Set(["ADMIN", "SYSTEM"]) as Set<string>
  const effectiveRole: string | null = dbRole
  const isAdmin = !!clerkId && (isOverride || (effectiveRole ? allowed.has(effectiveRole) : false))

  if (!isAdmin) redirect("/unauthorized")
  return (
    <ClerkProvider>
      <AppLayout>
        <AppContent>
          {children}
        </AppContent>
      </AppLayout>
    </ClerkProvider>
  )
}