"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { HeaderActions } from "../../(components)/layout/HeaderActions"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster, toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import Link from "next/link"

type Alliance = {
  id: string
  tag: string
  name: string
  createdAt: string
  updatedAt: string
  stats?: StatRow[]
  players?: PlayerRow[]
  applications?: ApplicationRow[]
  _count?: {
    players: number
    stats: number
    applications: number
  }
}

type StatRow = {
  id: string
  totalPower: number
  snapshot: string
}

type PlayerRow = {
  id: string
  name: string
  rokId: string
  stats?: Array<{
    power: number
    killPoints: number
    t4Kills: number
    t5Kills: number
    deaths: number
  }>
  _count?: {
    stats: number
    commanders: number
    equipment: number
  }
}

type ApplicationRow = {
  id: string
  status: string
  createdAt: string
  event: {
    id: string
    name: string
  }
  player: {
    id: string
    name: string
    alliance?: {
      tag: string
      name: string
    } | null
  }
}

export default function AllianceDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { getToken } = useAuth()
  const router = useRouter()
  const [alliance, setAlliance] = useState<Alliance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [tag, setTag] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (alliance) {
      setTag(alliance.tag)
      setName(alliance.name)
    }
  }, [alliance])

  useEffect(() => {
    const fetchAlliance = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) {
          setError('Unauthorized')
          return
        }

        const res = await fetch(
          `/api/v1/alliance?id=${encodeURIComponent(id)}&players=true&stats=true&applications=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch alliance')
        }

        setAlliance(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAlliance()
  }, [getToken, id])

  const latestStats = useMemo(() => {
    if (!alliance?.stats?.length) return null
    return alliance.stats.reduce((latest, stat) =>
      new Date(stat.snapshot) > new Date(latest.snapshot) ? stat : latest
    )
  }, [alliance?.stats])

  const totalPlayerPower = useMemo(() => {
    if (!alliance?.players?.length) return 0
    return alliance.players.reduce((total, player) => {
      const latestPlayerStat = player.stats?.[0]
      return total + (latestPlayerStat?.power || 0)
    }, 0)
  }, [alliance?.players])

  const statsColumns = useMemo<ColumnDef<StatRow>[]>(
    () => [
      {
        accessorKey: 'snapshot',
        header: 'Date',
        cell: ({ getValue }) => format(new Date(getValue<string>()), 'MMM dd, yyyy HH:mm'),
      },
      {
        accessorKey: 'totalPower',
        header: 'Total Power',
        cell: ({ getValue }) => (getValue<number>() ?? 0).toLocaleString(),
      },
    ],
    []
  )

  const playersColumns = useMemo<ColumnDef<PlayerRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Governor',
        cell: ({ getValue, row }) => (
          <div>
            <div className="font-medium">{getValue<string>()}</div>
            <div className="text-sm text-muted-foreground">ID: {row.original.rokId}</div>
          </div>
        ),
      },
      {
        id: 'power',
        header: 'Power',
        accessorFn: (row) => row.stats?.[0]?.power ?? 0,
        cell: ({ getValue }) => (getValue<number>() ?? 0).toLocaleString(),
      },
      {
        id: 'killPoints',
        header: 'Kill Points',
        accessorFn: (row) => row.stats?.[0]?.killPoints ?? 0,
        cell: ({ getValue }) => (getValue<number>() ?? 0).toLocaleString(),
      },
      {
        id: 'commanders',
        header: 'Commanders',
        accessorFn: (row) => row._count?.commanders ?? 0,
        cell: ({ getValue }) => getValue<number>() ?? 0,
      },
      {
        id: 'equipment',
        header: 'Equipment',
        accessorFn: (row) => row._count?.equipment ?? 0,
        cell: ({ getValue }) => getValue<number>() ?? 0,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/governors/${row.original.id}`}>View</Link>
          </Button>
        ),
      },
    ],
    []
  )

  const applicationsColumns = useMemo<ColumnDef<ApplicationRow>[]>(
    () => [
      {
        accessorKey: 'event.name',
        header: 'Event',
      },
      {
        accessorKey: 'player.name',
        header: 'Governor',
        cell: ({ getValue, row }) => (
          <div>
            <div className="font-medium">{getValue<string>()}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.player.alliance ? `${row.original.player.alliance.tag}` : 'No Alliance'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue<string>()
          const statusColors = {
            NEW: 'bg-blue-100 text-blue-800',
            REVIEWING: 'bg-yellow-100 text-yellow-800',
            APPROVED: 'bg-green-100 text-green-800',
            DECLINED: 'bg-red-100 text-red-800',
            CLOSED: 'bg-gray-100 text-gray-800',
          }
          return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
              {status}
            </span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Applied',
        cell: ({ getValue }) => format(new Date(getValue<string>()), 'MMM dd, yyyy'),
      },
    ],
    []
  )

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/alliance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, tag, name }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to update alliance')
      }
      setEditOpen(false)
      router.refresh()
      toast.success('Alliance updated successfully')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  if (!alliance) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Alliance not found</div>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-bold">
              {alliance.tag}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{alliance.name}</h1>
            <p className="text-muted-foreground">Tag: [{alliance.tag}]</p>
            <p className="text-sm text-muted-foreground">
              Created: {format(new Date(alliance.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        <HeaderActions>
          <Button variant="outline" onClick={() => router.back()}>
            Back to Alliances
          </Button>
          <Button onClick={() => setEditOpen(true)}>
            Edit Alliance
          </Button>
        </HeaderActions>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Power</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestStats?.totalPower?.toLocaleString() ?? 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Governors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alliance._count?.players ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Governor Power Sum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPlayerPower.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alliance._count?.stats ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Power History */}
      <Card>
        <CardHeader>
          <CardTitle>Power History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={alliance.stats || []}
            columns={statsColumns}
            loading={false}
            pageSize={10}
            initialSorting={[{ id: 'snapshot', desc: true }]}
          />
        </CardContent>
      </Card>

      {/* Governors */}
      <Card>
        <CardHeader>
          <CardTitle>Governors ({alliance._count?.players ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={alliance.players || []}
            columns={playersColumns}
            loading={false}
            pageSize={10}
            initialSorting={[{ id: 'power', desc: true }]}
            searchable
            searchKeys={['name', 'rokId']}
            searchPlaceholder="Search governors..."
          />
        </CardContent>
      </Card>

      {/* Event Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Event Applications ({alliance._count?.applications ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={alliance.applications || []}
            columns={applicationsColumns}
            loading={false}
            pageSize={10}
            initialSorting={[{ id: 'createdAt', desc: true }]}
            searchable
            searchKeys={['event.name', 'player.name']}
            searchPlaceholder="Search applications..."
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Alliance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="tag">Tag</Label>
              <Input
                id="tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Alliance</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
