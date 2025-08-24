"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
// removed create dialog imports
import { Label } from "@/components/ui/label"
import { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { CheckIcon, XIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { HeaderActions } from "../(components)/layout/HeaderActions"

type PlayerLite = { id: string; name: string; rokId: string }

type EventApplicationRow = {
  id: string
  eventId: string
  player: PlayerLite
  status: string
  createdAt: string
  commanders?: { id: string }[]
  equipment?: { id: string }[]
  EventRanking?: { rank: number | null }[]
}

export default function ApplicationsPage() {
  const { getToken } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [apps, setApps] = useState<EventApplicationRow[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // No inline creation: admins manage existing submissions from elsewhere

  // Load all applications when status filter changes
  useEffect(() => {
    let cancel = false
    async function loadApps() {
      setLoadingApps(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Unauthorized")
        const qs = statusFilter !== "all" ? `?status=${encodeURIComponent(statusFilter)}` : ""
        const res = await fetch(`/api/v1/applications${qs}`,
          { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (res.status === 503) throw new Error(body.message || "Database unavailable")
          throw new Error(body.message || "Failed to load applications")
        }
        let rows = body as EventApplicationRow[]
        // sort by status then newest first
        const statusOrder: Record<string, number> = { NEW: 0, REVIEWING: 1, APPROVED: 2, DECLINED: 3, CLOSED: 4 }
        rows = rows.sort((a, b) => {
          const sa = statusOrder[a.status] ?? 99
          const sb = statusOrder[b.status] ?? 99
          if (sa !== sb) return sa - sb
          const da = new Date(a.createdAt).getTime()
          const db = new Date(b.createdAt).getTime()
          return db - da
        })
        if (!cancel) setApps(rows)
      } catch (e: any) {
        if (!cancel) setError(e.message || "Error loading applications")
      } finally {
        if (!cancel) setLoadingApps(false)
      }
    }
    loadApps()
    return () => { cancel = true }
  }, [getToken, statusFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return apps
    return apps.filter(a =>
      a.player?.name?.toLowerCase().includes(q) ||
      a.player?.rokId?.toLowerCase().includes(q)
    )
  }, [apps, search])

  const columns = useMemo<ColumnDef<EventApplicationRow>[]>(() => ([
    {
      id: "player",
      header: "Player",
      accessorFn: (row) => `${row.player?.name ?? ''}`,
      cell: ({ row }) => {
        const p = row.original.player
        const initials = (p?.name || "?")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("") || "?"
        const avatar = (p as any)?.userAvatar as string | undefined
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={avatar} alt={p?.name || 'Player'} />
              <AvatarFallback></AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{p?.name}</span>
              <span className="text-xs text-muted-foreground">ID: {p?.rokId}</span>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <span className="uppercase text-xs font-medium">{String(getValue() || "")}</span>
    },
    {
      id: "rank",
      header: "Rank",
      accessorFn: (row) => row.EventRanking && row.EventRanking[0]?.rank || null,
      cell: ({ getValue }) => <span>{getValue<number | null>() ?? "—"}</span>
    },
    {
      id: "cmdCount",
      header: "Commanders",
      accessorFn: (row) => row.commanders?.length ?? 0,
      cell: ({ getValue }) => <span>{getValue<number>()}</span>
    },
    {
      id: "eqCount",
      header: "Equipment",
      accessorFn: (row) => row.equipment?.length ?? 0,
      cell: ({ getValue }) => <span>{getValue<number>()}</span>
    },
    {
      id: "created",
      header: "Created",
      accessorKey: "createdAt",
      cell: ({ getValue }) => {
        const v = getValue() as string | undefined
        return v ? new Date(v).toLocaleString() : ""
      }
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/admin/applications/${row.original.id}`}>View</Link>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label="Approve (select rank on details)">
            <Link href={`/admin/applications/${row.original.id}`}> 
              <CheckIcon className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost" aria-label="Decline" onClick={() => handleStatus(row.original.id, 'DECLINED')}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
  ]), [])

  async function handleStatus(id: string, status: 'DECLINED') {
    try {
      const token = await getToken()
      if (!token) throw new Error('Unauthorized')
      const res = await fetch(`/api/v1/applications/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || 'Failed to update status')
  setApps(prev => prev.map(a => a.id === id ? { ...a, status: status, EventRanking: [] as any } : a))
      toast.success('Application declined')
    } catch (e: any) {
      toast.error(e.message || 'Error updating status')
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="min-w-[180px]">
            <Label className="sr-only">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="REVIEWING">Reviewing</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </HeaderActions>
      <Card>
        <CardContent className="p-0">
          <DataTable<EventApplicationRow>
              data={filtered}
              columns={columns}
              loading={loadingApps}
              error={error}
              pageSize={10}
              searchable
              searchKeys={["player.name", "player.rokId"] as any}
              searchPlaceholder="Search by player name or ID"
              excludeFromVisibilityToggle={["actions"]}
              initialSorting={[{ id: "created", desc: true }]}
            />
        </CardContent>
      </Card>
    </div>
  )
}
