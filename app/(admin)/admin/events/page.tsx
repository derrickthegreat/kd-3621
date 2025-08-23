'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppBreadcrumbs } from '../(components)/layout/AppBeadcrumbs'
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { EventCard } from '@/components/admin-panel/event-card'

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  archived?: boolean
}

export default function EventListPage() {
  const { getToken } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <>
      <Toaster />
      <AppBreadcrumbs items={[{title: "Admin", href: "/admin" }, { title: "Events" }]} />
      <div className="max-w-6xl mx-auto my-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Events</h1>
          <Button asChild className="cursor-pointer">
            <Link href="/admin/events/add">Add Event</Link>
          </Button>
        </div>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.filter(e => !e.archived).map(event => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                startDate={event.startDate}
                endDate={event.endDate}
                description={event.description}
                isArchived={event.archived}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
