"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

type Resolver = (id: string) => Promise<{ title: string | null; description?: string | null }>

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return Promise.reject(new Error(`Failed to fetch ${url}`))
  return res.json()
}

const resolvers: Record<string, Resolver> = {
  // /admin/players/[id]
  players: async (id: string) => {
    try {
      const data = await fetchJSON<any>(`/api/v1/governors?id=${encodeURIComponent(id)}`)
      return { title: data?.name ?? null }
    } catch {
      return { title: null }
    }
  },
  // /admin/alliances/[id]
  alliances: async (id: string) => {
    try {
      const data = await fetchJSON<any>(`/api/v1/alliance?id=${encodeURIComponent(id)}`)
      return { title: data?.name ?? data?.tag ?? null }
    } catch {
      return { title: null }
    }
  },
  // /admin/events/[id]
  events: async (id: string) => {
    try {
      const data = await fetchJSON<any>(`/api/v1/events?id=${encodeURIComponent(id)}`)
      return { title: data?.name ?? null, description: data?.description ?? null }
    } catch {
      return { title: null }
    }
  },
  // /admin/commanders/[id]
  commanders: async (id: string) => {
    try {
      const data = await fetchJSON<any>(`/api/v1/commander?id=${encodeURIComponent(id)}`)
      return { title: data?.name ?? null }
    } catch {
      return { title: null }
    }
  },
  // /admin/equipment/[id]
  equipment: async (id: string) => {
    try {
      const data = await fetchJSON<any>(`/api/v1/equipment?id=${encodeURIComponent(id)}`)
      return { title: data?.name ?? null }
    } catch {
      return { title: null }
    }
  },
}

export function useEntityTitle() {
  const pathname = usePathname()
  const [resolved, setResolved] = useState<{ title: string | null; description?: string | null } | null>(null)

  const { parent, idLike } = useMemo(() => {
    const parts = pathname?.split("/").filter(Boolean) ?? []
    const last = parts[parts.length - 1]
    const idLike = last && /^(?:[0-9a-fA-F-]{16,}|\d+)$/.test(last) ? last : null
    const parent = idLike ? parts[parts.length - 2] : null
    return { parent, idLike }
  }, [pathname])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setResolved(null)
      if (!parent || !idLike) return
  const resolver = resolvers[parent]
      if (!resolver) return
      try {
    const meta = await resolver(idLike)
    if (!cancelled) setResolved(meta)
      } catch {
    if (!cancelled) setResolved(null)
      }
    }
    run()
    return () => { cancelled = true }
  }, [parent, idLike])

  return { title: resolved?.title ?? null, description: resolved?.description }
}
