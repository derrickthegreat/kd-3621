'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppBreadcrumbs } from '../(components)/layout/AppBeadcrumbs'

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
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

  return (
    <>
    <AppBreadcrumbs items={[{title: "Admin", href: "/admin" }, { title: "Events" }]} />
    <div className="max-w-4xl mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events</CardTitle>
          <Button asChild>
            <Link href="/admin/events/add">Add Event</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {!loading && !error && events.length === 0 && (
            <p className="text-muted-foreground">No events found.</p>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:bg-muted transition-colors"
                  onClick={() => router.push(`/admin/events/${event.id}`)}
                >
                  <div className="text-lg font-medium">{event.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(event.startDate), 'PPpp')} →{' '}
                    {event.endDate
                      ? format(new Date(event.endDate), 'PPpp')
                      : '—'}
                  </div>
                  {event.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  )
}
