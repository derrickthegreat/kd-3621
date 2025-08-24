"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { HeaderActions } from "../(components)/layout/HeaderActions"

type PlayerListItem = {
  id: string
  name: string
  rokId: string
  alliance?: { id: string; name: string; tag?: string | null } | null
  stats?: { power?: number | null }[] | null
  _count?: { stats?: number }
}

type PlayerRow = PlayerListItem & {
  latestPower: number
  allianceTag?: string
  allianceName?: string
}

export default function PlayersPage() {
  const { getToken } = useAuth()
  const [data, setData] = useState<PlayerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Unauthorized")
        const res = await fetch(`/api/v1/governors`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const body = await res.json().catch(() => ([]))
        if (!res.ok) throw new Error(body?.message || "Failed to load players")
        if (!cancelled) setData(body as PlayerListItem[])
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [getToken])

  const rows: PlayerRow[] = useMemo(() => {
    return (data || []).map((p) => {
      const latestPower = Array.isArray(p.stats) && p.stats.length
        ? p.stats.reduce((max, s) => Math.max(max, Number(s?.power ?? 0)), 0)
        : 0
      return {
        ...p,
        latestPower,
        allianceTag: p.alliance?.tag ?? undefined,
        allianceName: p.alliance?.name ?? undefined,
      }
    })
  }, [data])

  const columns = useMemo<ColumnDef<PlayerRow>[]>(() => [
    { accessorKey: "name", header: "Name" },
  { accessorKey: "rokId", header: "ID" },
    {
      id: "alliance",
      header: "Alliance",
      accessorFn: (row) => row.allianceTag || row.allianceName || "-",
      cell: ({ row }) => {
        const r = row.original
        return (
          <span>
            {r.allianceTag ? `[${r.allianceTag}] ` : ""}
            {r.allianceName || "-"}
          </span>
        )
      },
    },
    {
      id: "power",
      header: "Power",
      accessorFn: (row) => row.latestPower ?? 0,
      cell: (info) => <span>{(info.getValue<number>() ?? 0).toLocaleString()}</span>,
    },
    {
      id: "snapshots",
      header: "Snapshots",
      accessorFn: (row) => row._count?.stats ?? 0,
      cell: (info) => <span>{(info.getValue<number>() ?? 0).toLocaleString()}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/admin/players/${row.original.id}`}>View</Link>
          </Button>
        </div>
      ),
    },
  ], [])

  return (
    <div className="p-4">
      <HeaderActions>
        <Button asChild size="sm">
          <Link href="/admin/players/add">Add Player</Link>
        </Button>
      </HeaderActions>
      <Card>
        <CardContent className="p-0">
          <DataTable<PlayerRow>
            data={rows}
            columns={columns}
            loading={loading}
            error={error}
            pageSize={10}
            initialSorting={[{ id: "power", desc: true }]}
            searchable
            searchKeys={["name", "rokId", "allianceTag", "allianceName"]}
            searchPlaceholder="Search by name, ID, or alliance"
            excludeFromVisibilityToggle={["actions"]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
