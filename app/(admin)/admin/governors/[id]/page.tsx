"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { HeaderActions } from "../../(components)/layout/HeaderActions"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Toaster, toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import Link from "next/link"

type Governor = {
  id: string
  rokId: string
  name: string
  alliance?: {
    id: string
    name: string
    tag?: string | null
  } | null
  stats: Array<{
    id: string
    power: number
    killPoints: number
    t4Kills: number
    t5Kills: number
    t45Kills: number
    deaths: number
    snapshot: string
  }>
  commanders: Array<{
    id: string
    level: number
    commander: {
      id: string
      name: string
      iconUrl: string
      rarity?: string
      speciality: string[]
    }
  }>
  equipment: Array<{
    id: string
    acquiredAt: string
    equipment: {
      id: string
      name: string
      slot: string
      rarity: string
      src: string
      alt?: string | null
    }
  }>
  UserPlayers: Array<{
    id: string
    user: {
      id: string
      username: string
      displayName?: string | null
      avatarUrl?: string | null
    }
  }>
  _count?: {
    stats: number
    commanders: number
    equipment: number
  }
  createdAt: string
  updatedAt: string
}

type StatRow = Governor['stats'][0]

export default function GovernorDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { getToken } = useAuth()
  const router = useRouter()
  const [governor, setGovernor] = useState<Governor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [rokId, setRokId] = useState('')

  useEffect(() => {
    if (governor) {
      setName(governor.name)
      setRokId(governor.rokId)
    }
  }, [governor])

  useEffect(() => {
    const fetchGovernor = async () => {
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
          `/api/v1/governors?id=${encodeURIComponent(id)}&equipment=true&commanders=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch governor')
        }

        setGovernor(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGovernor()
  }, [getToken, id])

  const latestStats = useMemo(() => {
    if (!governor?.stats?.length) return null
    return governor.stats.reduce((latest, stat) =>
      new Date(stat.snapshot) > new Date(latest.snapshot) ? stat : latest
    )
  }, [governor?.stats])

  const statsColumns = useMemo<ColumnDef<StatRow>[]>(
    () => [
      {
        accessorKey: 'snapshot',
        header: 'Date',
        cell: ({ getValue }) => format(new Date(getValue<string>()), 'MMM dd, yyyy HH:mm'),
      },
      {
        accessorKey: 'power',
        header: 'Power',
        cell: ({ getValue }) => (getValue<number>() ?? 0).toLocaleString(),
      },
      {
        accessorKey: 'killPoints',
        header: 'Kill Points',
        cell: ({ getValue }) => (getValue<number>() ?? 0).toLocaleString(),
      },
      {
        accessorKey: 't45Kills',
        header: 'T4/T5 Kills',
        cell: ({ getValue }) => (getValue<number>() ?? 0).toLocaleString(),
      },
      {
        accessorKey: 'deaths',
        header: 'Deaths',
        cell: ({ getValue }) => (getValue<number>() ?? 0).toLocaleString(),
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
      const res = await fetch(`/api/v1/governors?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, rokId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to update governor')
      }
      setEditOpen(false)
      router.refresh()
      toast.success('Governor updated successfully')
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

  if (!governor) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground">Governor not found</div>
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
            <AvatarImage src={governor.UserPlayers?.[0]?.user?.avatarUrl || undefined} />
            <AvatarFallback>
              {governor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{governor.name}</h1>
            <p className="text-muted-foreground">ID: {governor.rokId}</p>
            {governor.alliance && (
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {governor.alliance.tag ? `${governor.alliance.tag}` : 'No Tag'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {governor.alliance.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <HeaderActions>
          <Button variant="outline" onClick={() => router.back()}>
            Back to Governors
          </Button>
          <Button onClick={() => setEditOpen(true)}>
            Edit Governor
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
              {latestStats?.power?.toLocaleString() ?? 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kill Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestStats?.killPoints?.toLocaleString() ?? 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">T4/T5 Kills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestStats?.t45Kills?.toLocaleString() ?? 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {governor._count?.stats ?? 0}
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
            data={governor.stats || []}
            columns={statsColumns}
            loading={false}
            pageSize={10}
            initialSorting={[{ id: 'snapshot', desc: true }]}
          />
        </CardContent>
      </Card>

      {/* Commanders */}
      <Card>
        <CardHeader>
          <CardTitle>Commanders ({governor._count?.commanders ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {governor.commanders?.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {governor.commanders.map((pc) => (
                <div key={pc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={pc.commander.iconUrl} alt={pc.commander.name} />
                    <AvatarFallback>{pc.commander.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{pc.commander.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Level {pc.level}
                      {pc.commander.rarity && (
                        <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded text-xs font-medium bg-muted text-muted-foreground">
                          {pc.commander.rarity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No commanders assigned</p>
          )}
        </CardContent>
      </Card>

      {/* Equipment */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment ({governor._count?.equipment ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {governor.equipment?.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {governor.equipment.map((pe) => (
                <div key={pe.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={pe.equipment.src} alt={pe.equipment.name} />
                    <AvatarFallback>{pe.equipment.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{pe.equipment.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pe.equipment.slot}
                      <span className="inline-flex items-center px-2 py-0.5 ml-2 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {pe.equipment.rarity}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Acquired: {format(new Date(pe.acquiredAt), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No equipment owned</p>
          )}
        </CardContent>
      </Card>

      {/* User Linkage */}
      {governor.UserPlayers?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Linked User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={governor.UserPlayers[0].user.avatarUrl || undefined} />
                <AvatarFallback>
                  {governor.UserPlayers[0].user.displayName?.[0] || governor.UserPlayers[0].user.username[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {governor.UserPlayers[0].user.displayName || governor.UserPlayers[0].user.username}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{governor.UserPlayers[0].user.username}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/users/${governor.UserPlayers[0].user.id}`}>
                  View User
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Governor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="rokId">RoK ID</Label>
              <Input
                id="rokId"
                value={rokId}
                onChange={(e) => setRokId(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Governor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
