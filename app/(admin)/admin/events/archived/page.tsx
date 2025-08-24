// Archived Events Page
// Archived Events Page
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { format } from 'date-fns'
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { HeaderActions } from "../../(components)/layout/HeaderActions"
import { EventQuickDialog } from '../EventQuickDialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, RotateCcw, Trash2, Calendar as CalendarIcon } from 'lucide-react'

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  isArchived?: boolean
  color?: string | null
}

export default function ArchivedEventsPage() {
  const { getToken } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quickOpen, setQuickOpen] = useState(false)
  const [selected, setSelected] = useState<Event | null>(null)

  useEffect(() => {
    let cancel = false
    async function fetchEvents() {
      try {
        const token = await getToken()
        if (!token) {
          if (!cancel) setError('Unauthorized')
          toast('Unauthorized')
          return
        }
        const res = await fetch('/api/v1/events?archived=true', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => [])
        if (!res.ok) throw new Error(data?.message || 'Failed to fetch events')
        if (!cancel) setEvents(data)
      } catch (err: any) {
        if (!cancel) setError(err.message)
        toast(err.message)
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    fetchEvents()
    return () => { cancel = true }
  }, [getToken])

  async function unarchiveById(id: string) {
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isArchived: false, closedAt: null }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || 'Failed to unarchive event')
      toast('Event unarchived')
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (e: any) {
      toast(e.message || 'Error unarchiving event')
    }
  }

  async function handleDelete(id: string) {
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || 'Failed to delete event')
      toast('Event deleted')
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (e: any) {
      toast(e.message || 'Error deleting event')
    }
  }

  const columns = useMemo<ColumnDef<Event>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <button
          className="text-left hover:underline flex items-center gap-2"
          onClick={() => { setSelected(row.original); setQuickOpen(true) }}
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          {row.original.name}
        </button>
      ),
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
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => (
        <span className="line-clamp-1 text-muted-foreground text-sm">{String(getValue() || '')}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild aria-label="View">
                <Link href={`/admin/events/${row.original.id}`}>
                  <Eye className="size-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Unarchive" onClick={() => unarchiveById(row.original.id)}>
                <RotateCcw className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Unarchive</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => handleDelete(row.original.id)}>
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ], [])

  return (
    <>
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Showing archived events</span>
        </div>
      </HeaderActions>
      <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable<Event>
                data={events}
                columns={columns}
                loading={loading}
                error={error}
                pageSize={10}
                searchable
                searchKeys={["name", "description"]}
                searchPlaceholder="Search by name or description"
                excludeFromVisibilityToggle={["actions"]}
                initialSorting={[{ id: 'start', desc: true }]}
              />
            </CardContent>
          </Card>
        )}

        <EventQuickDialog
          open={quickOpen}
          onOpenChange={setQuickOpen}
          event={selected}
          canEdit={true}
          onUpdated={(updated) => {
            setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
          }}
        />
      </div>
    </>
  )
}
