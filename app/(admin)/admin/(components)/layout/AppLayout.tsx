'use client'

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, NavUserProps } from "@/components/admin-panel/app-sidebar"
import { ReactNode, useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { HeaderActionsProvider } from "./HeaderActions"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { getToken } = useAuth()
  const [user, setUser] = useState<NavUserProps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setError('Unauthorized')
          return
        }

        const res = await fetch('/api/v1/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()
        const primaryEmail = data.user?.emailAddresses?.[0]?.emailAddress || ""
        const user: NavUserProps = {
          name: `${data.user?.firstName ?? ''} ${data.user?.lastName ?? ''}`.trim(),
          email: primaryEmail,
          avatar: data.user?.imageUrl ?? ""
        }
        setUser(user);
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch user')
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [getToken])
  return (
    <SidebarProvider>
      <AppSidebar title="KD 3621" homeUrl="/admin" user={user} />
      <HeaderActionsProvider>
        {children}
      </HeaderActionsProvider>
    </SidebarProvider>
  )
}
