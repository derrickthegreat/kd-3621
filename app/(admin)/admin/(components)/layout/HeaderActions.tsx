"use client"

import React, { createContext, useContext, useMemo, useState } from "react"

type Ctx = {
  actions: React.ReactNode | null
  setActions: (n: React.ReactNode | null) => void
}

const HeaderActionsContext = createContext<Ctx | undefined>(undefined)

export function HeaderActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<React.ReactNode | null>(null)
  const value = useMemo(() => ({ actions, setActions }), [actions])
  return <HeaderActionsContext.Provider value={value}>{children}</HeaderActionsContext.Provider>
}

export function useHeaderActionsContext() {
  const ctx = useContext(HeaderActionsContext)
  if (!ctx) throw new Error("useHeaderActionsContext must be used within HeaderActionsProvider")
  return ctx
}

// Declarative helper: render this in a page to set header actions; cleans up on unmount
export function HeaderActions({ children }: { children: React.ReactNode }) {
  const { setActions } = useHeaderActionsContext()
  React.useEffect(() => {
    setActions(children)
    return () => setActions(null)
  }, [children, setActions])
  return null
}
