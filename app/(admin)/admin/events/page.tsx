'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { EventCard } from '@/components/admin-panel/event-card'
import { HeaderActions } from "../(components)/layout/HeaderActions"
import { Input } from '@/components/ui/input'
import { CalendarEvent, CalendarView } from '@/components/ui/calendar-view'
import { EventQuickDialog } from './EventQuickDialog'
import { CreateEventDialog } from './CreateEventDialog'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Pencil, Archive } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  archived?: boolean
  color?: string | null
  createdAt?: string
}

export default function EventListPage() {
  const { getToken } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [quickOpen, setQuickOpen] = useState(false)
  const [selected, setSelected] = useState<Event | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setError('Unauthorized')
          return
        }

        const res = await fetch('/api/v1/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch events')
        }

        setEvents(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [getToken])

  // Fetch user role to determine edit access
  useEffect(() => {
    const loadMe = async () => {
      try {
        const token = await getToken()
        if (!token) return
        const res = await fetch('/api/v1/users/me', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const data = await res.json()
        // Basic heuristic: allow edit if any role-like metadata denotes admin/system; fallback true if service maps it
        const role = (data?.user?.publicMetadata?.role || data?.role || '').toString().toLowerCase()
        setCanEdit(role === 'admin' || role === 'system')
      } catch {}
    }
    loadMe()
  }, [getToken])

  const handleArchive = async (id: string) => {
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/events/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archive: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.message || 'Failed to archive event');
        throw new Error(data.message || 'Failed to archive event');
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast('Event archived');
    } catch (err: any) {
      setError(err.message);
      toast(err.message);
    }
  };

  const calendarEvents: CalendarEvent[] = (events || [])
    .filter((e) => !e.archived)
  .map((e, idx) => ({ id: e.id, title: e.name, start: e.startDate, end: e.endDate, color: e.color || undefined, data: { createdAt: e.createdAt, idx } }))

  // Filtered list data for the table based on the same search input
  const filteredList = (events || [])
    .filter((e) => !e.archived)
    .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))

  const columns: ColumnDef<Event>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          className="text-left hover:underline"
          onClick={() => {
            const found = events.find((e) => e.id === row.original.id) || null
            setSelected(found)
            setQuickOpen(true)
          }}
        >
          {row.original.name}
        </button>
      )
    },
    {
      id: 'start',
      header: 'Start',
      accessorFn: (row) => row.startDate,
      cell: ({ getValue }) => {
        const v = getValue() as string
        return v ? format(new Date(v), 'PPp') : ''
      },
    },
    {
      id: 'end',
      header: 'End',
      accessorFn: (row) => row.endDate,
      cell: ({ getValue }) => {
        const v = getValue() as string | null | undefined
        return v ? format(new Date(v), 'PPp') : ''
      },
    },
    {
      id: 'color',
      header: 'Color',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: row.original.color || undefined }} />
          <span className="text-xs text-muted-foreground">{row.original.color || ''}</span>
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/events/${row.original.id}`}>View</Link>
          </Button>
          {canEdit && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    onClick={() => {
                      const found = events.find((e) => e.id === row.original.id) || null
                      setSelected(found)
                      setQuickOpen(true)
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
          aria-label="Archive"
          onClick={() => { setPendingArchiveId(row.original.id); setConfirmOpen(true) }}
                  >
          <Archive className="size-4" />
                  </Button>
                </TooltipTrigger>
        <TooltipContent>Archive</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      ),
      enableSorting: false,
    },
  ]

  return (
    <>
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border bg-background p-0.5">
            <Button variant={view === 'calendar' ? 'default' : 'ghost'} size="sm" onClick={() => setView('calendar')}>Calendar</Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')}>List</Button>
          </div>
          {canEdit && (
            <Button className="cursor-pointer" onClick={() => setCreateOpen(true)}>
              Add Event
            </Button>
          )}
        </div>
      </HeaderActions>
  <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 px-1">
          <Input
            placeholder="Search events by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            {view === 'calendar' ? (
              <CalendarView
                events={calendarEvents}
                filterText={search}
                readOnly={false}
                density="compact"
                onEventClick={(ev) => {
                  const found = events.find((e) => e.id === ev.id) || null
                  setSelected(found)
                  setQuickOpen(true)
                }}
              />
            ) : (
              <DataTable
                data={filteredList}
                columns={columns}
                loading={loading}
                error={error}
                searchable={false}
                pageSize={10}
              />
            )}
            <EventQuickDialog
              open={quickOpen}
              onOpenChange={setQuickOpen}
              event={selected}
              canEdit={canEdit}
              onUpdated={(updated) => {
                setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
              }}
            />

            <CreateEventDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              canEdit={canEdit}
              onCreated={(created) => {
                setEvents((prev) => [created as any, ...prev])
                // Optionally switch to list or keep calendar; no redirect needed
              }}
            />

            <Dialog open={confirmOpen} onOpenChange={(v) => { if (!v) { setConfirmOpen(false); setPendingArchiveId(null) } }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Archive event?</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">This moves the event to Archived. You can restore it later.</p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setConfirmOpen(false); setPendingArchiveId(null) }}>Cancel</Button>
                  <Button
                    variant="default"
                    disabled={!pendingArchiveId || archiving}
                    onClick={async () => {
                      if (!pendingArchiveId) return
                      setArchiving(true)
                      await handleArchive(pendingArchiveId)
                      setArchiving(false)
                      setConfirmOpen(false)
                      setPendingArchiveId(null)
                    }}
                  >
                    {archiving ? 'Archiving…' : 'Confirm'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </>
  )
}
