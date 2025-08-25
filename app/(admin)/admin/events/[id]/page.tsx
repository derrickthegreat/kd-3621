'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster, toast } from 'sonner'
import { HeaderActions } from "../../(components)/layout/HeaderActions"
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { format, differenceInCalendarDays, differenceInDays, isAfter, isBefore, isSameDay } from 'date-fns'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  isArchived?: boolean
  color?: string | null
}

type Application = {
  id: string
  status: string
  createdAt: string
  player: { id: string; name?: string | null }
}

export default function EventDetailPage() {
  const { id } = useParams()
  const { getToken } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#2563eb')
  const [apps, setApps] = useState<Application[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const router = useRouter()

  const invalidRange = useMemo(() => {
    if (!startDate || !endDate) return false
    const s = new Date(startDate)
    const e = new Date(endDate)
    return e.getTime() < s.getTime()
  }, [startDate, endDate])

  useEffect(() => {
    if (event) {
      setName(event.name)
  setStartDate(event.startDate?.slice(0, 10) || '')
  setEndDate(event.endDate?.slice(0, 10) || '')
      setDescription(event.description || '')
  setColor(event.color || '#2563eb')
    }
  }, [event])

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setError('Unauthorized')
          return
        }

        const res = await fetch(`/api/v1/events?id=${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch event')
        }

        setEvent(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchEvent()
  }, [getToken, id])

  // Load applications on mount/when id changes since Applications are now part of overview
  useEffect(() => {
    const fetchApps = async () => {
      if (!id) return
      setAppsLoading(true)
      try {
        const token = await getToken()
        if (!token) return
        const res = await fetch(`/api/v1/events/${id}/applications`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load applications')
        setApps(data)
      } catch (e: any) {
        toast(e.message)
      } finally {
        setAppsLoading(false)
      }
    }
    fetchApps()
  }, [id, getToken])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
  const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, startDate, endDate, description, color }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to update event')
      }
  setEditOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!event) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/events?id=${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isArchived: true, closedAt: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.message || 'Failed to archive event', { position: 'top-center' });
        return;
      }
      toast('Event has been archived', { position: 'top-center' });
      router.push('/admin/events/archived');
    } catch (err: any) {
      toast('Failed to archive event', { position: 'top-center' });
    }
  };

  const handleUnarchive = async () => {
    if (!event) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/events?id=${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isArchived: false, closedAt: null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.message || 'Failed to unarchive event', { position: 'top-center' });
        return;
      }
      toast('Event has been unarchived', { position: 'top-center' });
      router.push('/admin/events');
    } catch (err: any) {
      toast('Failed to unarchive event', { position: 'top-center' });
    }
  };

  const handleDelete = async (eventId?: string) => {
    if (!eventId) return
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to delete event')
      }
      router.push('/admin/events')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const start = useMemo(() => (event?.startDate ? new Date(event.startDate) : null), [event?.startDate])
  const end = useMemo(() => (event?.endDate ? new Date(event.endDate) : null), [event?.endDate])
  const duration = useMemo(() => {
    if (!start) return 0
    return end ? differenceInDays(end, start) + 1 : 1
  }, [start, end])
  const daysUntil = useMemo(() => (start ? differenceInCalendarDays(start, new Date()) : 0), [start])
  const status = useMemo(() => {
    if (!start) return 'Future' as const
    if (event?.isArchived) return 'Archived' as const
    const now = new Date()
    if (end) {
      if (isBefore(now, start)) return 'Future' as const
      if (isAfter(now, end)) return 'Ended' as const
      return 'Ongoing' as const
    }
    if (isBefore(now, start)) return 'Future' as const
    if (isSameDay(now, start)) return 'Ongoing' as const
    return 'Ended' as const
  }, [start, end, event?.isArchived])

  if (loading) return <Card className="w-full my-6"><CardContent><Skeleton className="h-8 w-full" /></CardContent></Card>
  if (error) return <Card className="w-full my-6"><CardContent><p className="text-red-500">{error}</p></CardContent></Card>
  if (!event) return <Card className="w-full my-6"><CardContent><p>Event not found.</p></CardContent></Card>

  const appsCount = apps?.length ?? 0

  return (
    <>
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => router.push('/admin/events')}>Back</Button>
          {event.isArchived ? (
            <Button size="sm" onClick={handleUnarchive}>Restore</Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={handleArchive}>Archive</Button>
          )}
          <Button size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
        </div>
      </HeaderActions>
      <div className="w-full my-4 space-y-6 px-4 md:px-6 lg:px-8">
        {/* Header row (no card, no color) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{start ? format(start, 'PP') : '—'}{end ? ` – ${format(end, 'PP')}` : ''}</span>
              <StatusBadge status={status} />
            </div>
            <div className="text-xs text-muted-foreground">
              {duration} {duration === 1 ? 'day' : 'days'}
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="space-y-2">
          <h2 className="text-base font-semibold tracking-tight">Overview</h2>
        </div>
        {/* Overview grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-sm">Description</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {event.description ? (
                  <p className="text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No description provided.</p>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Sidebar (deduped) */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-sm">At a glance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <Stat label="Applicants" value={appsCount} />
                  <div>
                    <div className="text-muted-foreground">Color</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border" style={{ background: event.color || '#e5e7eb' }} />
                      <span className="font-mono text-xs text-muted-foreground">{event.color || 'default'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Applications */}
        <div className="space-y-2">
          <h2 className="text-base font-semibold tracking-tight">Applications {appsCount > 0 && <span className="ml-1 text-xs text-muted-foreground">({appsCount})</span>}</h2>
          <ApplicationsSection apps={apps} loading={appsLoading} />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">End date</Label>
                <Input id="end" type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                {invalidRange && (
                  <p className="text-xs text-rose-600">End date must be on or after the start date.</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 p-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={invalidRange}>Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ApplicationsSection({ apps, loading }: { apps: Application[]; loading: boolean }) {
  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: 'player',
      header: 'Player',
      cell: ({ row }) => {
        const p = row.original.player
        return p?.name || p?.id || 'Unknown'
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = (getValue() as string) || ''
        const tone = s === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : s === 'rejected' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'
        return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tone}`}>{s || 'pending'}</span>
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Applied',
      cell: ({ getValue }) => {
        const v = getValue() as string
        return v ? format(new Date(v), 'PP p') : ''
      },
    },
  ]

  if (!loading && (!apps || apps.length === 0)) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">No applications yet.</CardContent>
      </Card>
    )
  }

  return (
    <DataTable
      data={apps}
      columns={columns}
      loading={loading}
      error={null}
      searchable={false}
      pageSize={10}
    />
  )
}

function StatusBadge({ status }: { status: 'Archived' | 'Future' | 'Ongoing' | 'Ended' }) {
  const tone = {
    Archived: 'bg-rose-50 text-rose-700 border-rose-200',
    Future: 'bg-sky-50 text-sky-700 border-sky-200',
    Ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Ended: 'bg-slate-100 text-slate-700 border-slate-200',
  }[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>{status}</span>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}
