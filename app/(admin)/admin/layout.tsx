import { ReactNode } from "react"
import { ClerkProvider } from '@clerk/nextjs';
import { AppContent } from "./(components)/layout/AppContent"
import { AppLayout } from "./(components)/layout/AppLayout"

export default function Layout({ children }: { children: ReactNode }) {
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