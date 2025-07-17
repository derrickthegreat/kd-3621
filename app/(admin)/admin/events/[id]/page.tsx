'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
}

export default function EventDetailPage() {
  const { id } = useParams()
  const { getToken } = useAuth()
  const router = useRouter()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Event Details</CardTitle>
          <Button variant="outline" asChild>
            <Link href="/admin/events">← Back to Events</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && event && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{event.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.startDate), 'PPpp')} →{' '}
                  {event.endDate
                    ? format(new Date(event.endDate), 'PPpp')
                    : '—'}
                </p>
              </div>
              {event.description && (
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
