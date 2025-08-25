"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function AllianceDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/v1/alliance?id=${encodeURIComponent(String(id))}`)
        if (!res.ok) throw new Error("Failed to load alliance")
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [id])

  if (loading) return <div className="p-4">Loading alliance…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!data) return <div className="p-4">No data.</div>

  return (
    <div className="p-4 space-y-2">
      {data.latestStat && (
        <div className="text-sm">Total Power: {data.latestStat?.totalPower ?? "-"}</div>
      )}
    </div>
  )
}
