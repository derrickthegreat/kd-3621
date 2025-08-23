'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from 'sonner'
import { toast } from 'sonner'
import { EventDetailsCard } from '@/components/admin-panel/event-detail-card'

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  isArchived?: boolean
}

export default function EventDetailPage() {
  const { id } = useParams()
  const { getToken } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (event) {
      setName(event.name)
      setStartDate(event.startDate?.slice(0, 10) || '')
      setEndDate(event.endDate?.slice(0, 10) || '')
      setDescription(event.description || '')
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
        body: JSON.stringify({ name, startDate, endDate, description }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to update event')
      }
      setEditMode(false)
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

  if (loading) return <Card className="max-w-2xl mx-auto my-10"><CardContent><Skeleton className="h-8 w-full" /></CardContent></Card>
  if (error) return <Card className="max-w-2xl mx-auto my-10"><CardContent><p className="text-red-500">{error}</p></CardContent></Card>
  if (!event) return <Card className="max-w-2xl mx-auto my-10"><CardContent><p>Event not found.</p></CardContent></Card>

  return (
    <>
      <Toaster />
      <div className="max-w-2xl mx-auto my-10">
        <EventDetailsCard
          event={event}
          editMode={editMode}
          name={name}
          startDate={startDate}
          endDate={endDate}
          description={description}
          loading={loading}
          error={error}
          onEdit={() => setEditMode(true)}
          onCancelEdit={() => setEditMode(false)}
          onSave={handleUpdate}
          onDelete={handleDelete}
          onBack={() => router.push('/admin/events')}
          onChangeName={setName}
          onChangeStartDate={setStartDate}
          onChangeEndDate={setEndDate}
          onChangeDescription={setDescription}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
        />
      </div>
    </>
  )
}
