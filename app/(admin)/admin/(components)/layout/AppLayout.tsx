'use client'

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, NavUserProps } from "@/components/admin-panel/app-sidebar"
import { ReactNode, useEffect, useState } from "react"
import { ADMIN_PANEL } from "@/lib/navigation"
import { useAuth } from "@clerk/nextjs"

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
        console.log(data)
        const user: NavUserProps = {
          name: data.user.firstName,
          email: data.user.emailAddresses[0].emailAddresses,
          avatar: data.user.imageUrl
        }
        setUser(user);
        console.log(user)
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
      <AppSidebar title="KD 3621" navigation={ADMIN_PANEL} user={user} />
      {children}
    </SidebarProvider>
  )
}
