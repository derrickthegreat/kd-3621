// Archived Events Page
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { EventCard } from '@/components/admin-panel/event-card'
import { EventDetailsCard } from '@/components/admin-panel/event-detail-card'

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  isArchived?: boolean
}

export default function ArchivedEventsPage() {
  const { getToken } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Event | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (selected) {
      setName(selected.name)
      setStartDate(selected.startDate?.slice(0, 10) || '')
      setEndDate(selected.endDate?.slice(0, 10) || '')
      setDescription(selected.description || '')
    }
  }, [selected])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = await getToken()
        if (!token) {
          setError('Unauthorized')
          toast('Unauthorized')
          return
        }
        const res = await fetch('/api/v1/events?archived=true', {
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
        toast(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [getToken])

  const handleUnarchive = async () => {
    if (!selected) return
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${selected.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isArchived: false, closedAt: null }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast(data.message || 'Failed to unarchive event', { position: 'top-center' })
        return
      }
      toast('Event has been unarchived', { position: 'top-center' })
      setSelected(null)
      setEditMode(false)
      setLoading(true)
      // Refresh only archived events
      const res2 = await fetch('/api/v1/events?archived=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEvents(await res2.json())
      setLoading(false)
    } catch (err: any) {
      toast(err.message, { position: 'top-center' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!id) return
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        toast(data.message || 'Failed to delete event', { position: 'top-center' })
        return
      }
      toast('Event has been deleted', { position: 'top-center' })
      setSelected(null)
      setEditMode(false)
      setLoading(true)
      // Refresh only archived events
      const res2 = await fetch('/api/v1/events?archived=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEvents(await res2.json())
      setLoading(false)
    } catch (err: any) {
      toast(err.message, { position: 'top-center' })
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${selected.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, startDate, endDate, description }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast(data.message || 'Failed to update event', { position: 'top-center' })
        setLoading(false)
        return
      }
      toast('Event has been updated', { position: 'top-center' })
      setEditMode(false)
      setSelected(null)
      setLoading(true)
      // Refresh only archived events
      const res2 = await fetch('/api/v1/events?archived=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEvents(await res2.json())
      setLoading(false)
    } catch (err: any) {
      toast(err.message, { position: 'top-center' })
      setLoading(false)
    }
  }

  return (
    <>
      <Toaster />
  <div className="max-w-6xl mx-auto my-6">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : selected ? (
          <div className="max-w-2xl mx-auto">
            <EventDetailsCard
              event={selected}
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
              onBack={() => setSelected(null)}
              onChangeName={setName}
              onChangeStartDate={setStartDate}
              onChangeEndDate={setEndDate}
              onChangeDescription={setDescription}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.filter(e => e.isArchived).map(event => (
              <EventCard
                key={event.id}
                id={event.id}
                name={event.name}
                startDate={event.startDate}
                endDate={event.endDate}
                description={event.description}
                isArchived={event.isArchived}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
