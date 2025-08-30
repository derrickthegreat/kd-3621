"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ColumnDef } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast, Toaster } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { HeaderActions } from "../(components)/layout/HeaderActions"
import { format } from "date-fns"

type AllianceListItem = {
  id: string
  tag: string
  name: string
  createdAt: string
  stats?: { snapshot: string; totalPower: number }[]
  _count?: {
    players: number
    stats: number
    applications: number
  }
}

type AllianceRow = AllianceListItem & { totalPower: number; latestSnapshot?: string }

export default function AlliancesPage() {
  const { getToken } = useAuth()
  const [data, setData] = useState<AllianceListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Unauthorized")
  const res = await fetch(`/api/v1/alliance?stats=true`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || "Failed to load alliances")
        }
        const json = (await res.json()) as AllianceListItem[]
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [getToken])

  const withDerived: AllianceRow[] = useMemo(() => {
    // compute latest totalPower and latestSnapshot per alliance
    return data.map((a) => {
      let totalPower = 0
      let latestSnapshot: string | undefined
      
      if (a.stats && a.stats.length) {
        // Find the latest stat by snapshot date
        const latestStat = a.stats.reduce((latest, stat) => {
          const statDate = new Date(stat.snapshot)
          const latestDate = new Date(latest.snapshot)
          return statDate > latestDate ? stat : latest
        })
        
        totalPower = Number(latestStat.totalPower) || 0
        latestSnapshot = latestStat.snapshot
      }
      
      return { ...a, totalPower, latestSnapshot }
    })
  }, [data])

  const columns = useMemo<ColumnDef<AllianceRow>[]>(
    () => [
      { accessorKey: "tag", header: "Tag", cell: (info) => <span className="font-medium">{info.getValue() as string}</span> },
      { accessorKey: "name", header: "Name" },
      {
        id: "totalPower",
        header: "Total Power",
        accessorFn: (row: AllianceRow) => row.totalPower ?? 0,
        cell: (info) => <span>{(info.getValue<number>() ?? 0).toLocaleString()}</span>,
      },
      {
        id: "players",
        header: "Players",
        accessorFn: (row: AllianceRow) => row._count?.players ?? 0,
        cell: (info) => <span>{(info.getValue<number>() ?? 0).toLocaleString()}</span>,
      },
      {
        id: "snapshots",
        header: "Snapshots",
        accessorFn: (row: AllianceRow) => row._count?.stats ?? 0,
        cell: (info) => <span>{(info.getValue<number>() ?? 0).toLocaleString()}</span>,
      },
      {
        id: "applications",
        header: "Applications",
        accessorFn: (row: AllianceRow) => row._count?.applications ?? 0,
        cell: (info) => <span>{(info.getValue<number>() ?? 0).toLocaleString()}</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: (info) => format(new Date(info.getValue<string>()), 'MMM dd, yyyy'),
      },
      {
        id: "lastSnapshot",
        header: "Last Updated",
        accessorFn: (row: AllianceRow) => row.latestSnapshot ?? '',
        cell: (info) => {
          const value = info.getValue<string>()
          return value ? format(new Date(value), 'MMM dd, yyyy') : 'Never'
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button asChild size="sm" variant="secondary">
              <Link href={`/admin/alliances/${row.original.id}`}>View</Link>
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  async function onCreateAlliance(e: React.FormEvent) {
    e.preventDefault()
    if (!newTag.trim() || !newName.trim()) {
      toast("Tag and Name are required")
      return
    }
    try {
      setSaving(true)
      const token = await getToken()
      if (!token) throw new Error("Unauthorized")
      const res = await fetch(`/api/v1/alliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tag: newTag.trim(), name: newName.trim() }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || "Failed to create alliance")
      toast.success("Alliance created")
      // refresh list
      setData((prev) => [{ id: body.alliance.id ?? body.alliance?.[0]?.id ?? crypto.randomUUID(), tag: newTag.trim(), name: newName.trim(), createdAt: new Date().toISOString(), _count: { players: 0, stats: 0, applications: 0 } }, ...prev])
      setOpen(false)
      setNewTag("")
      setNewName("")
    } catch (e: any) {
      toast.error(e.message || "Error creating alliance")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Toaster />
      <HeaderActions>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Add Alliance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Alliance</DialogTitle>
            </DialogHeader>
            <form onSubmit={onCreateAlliance} className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="tag" className="col-span-1">Tag</Label>
                <Input id="tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} className="col-span-3" placeholder="e.g., ABC" />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label htmlFor="name" className="col-span-1">Name</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" placeholder="Alliance name" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </HeaderActions>
      <Card>
        <CardContent className="p-0">
          <DataTable<AllianceRow>
            data={withDerived}
            columns={columns}
            loading={loading}
            error={error}
            pageSize={10}
            initialSorting={[{ id: "totalPower", desc: true }, { id: "players", desc: true }, { id: "createdAt", desc: true }]}
            searchable
            searchKeys={["name", "tag"]}
            searchPlaceholder="Search by tag or name"
            excludeFromVisibilityToggle={["actions"]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

