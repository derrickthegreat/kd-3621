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

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  archived?: boolean
  color?: string | null
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/events?id=${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.message || 'Failed to delete event');
        throw new Error(data.message || 'Failed to delete event');
      }
      setEvents(events.filter(e => e.id !== id));
      toast('Event deleted');
    } catch (err: any) {
      setError(err.message);
      toast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents: CalendarEvent[] = (events || [])
    .filter((e) => !e.archived)
  .map((e) => ({ id: e.id, title: e.name, start: e.startDate, end: e.endDate, color: e.color || undefined }))

  return (
    <>
      <Toaster />
      <HeaderActions>
        <Button asChild className="cursor-pointer">
          <Link href="/admin/events/add">Add Event</Link>
        </Button>
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
            <CalendarView
              events={calendarEvents}
              filterText={search}
              readOnly={false}
              onEventClick={(ev) => {
                const found = events.find((e) => e.id === ev.id) || null
                setSelected(found)
                setQuickOpen(true)
              }}
            />
            <EventQuickDialog
              open={quickOpen}
              onOpenChange={setQuickOpen}
              event={selected}
              canEdit={canEdit}
              onUpdated={(updated) => {
                setEvents((prev) => prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
              }}
            />
          </>
        )}
      </div>
    </>
  )
}
