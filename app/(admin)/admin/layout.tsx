import { ReactNode } from "react"
import { AppContent } from "./(components)/layout/AppContent"
import { AppLayout } from "./(components)/layout/AppLayout"

export default function Layout({ children }: { children: ReactNode }) {

  return (
        <AppLayout>
        <AppContent>
            {children}
        </AppContent>
        </AppLayout>
  )
}