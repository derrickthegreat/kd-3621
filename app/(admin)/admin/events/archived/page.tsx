// Archived Events Page
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { AppBreadcrumbs } from '../../(components)/layout/AppBeadcrumbs'
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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

  const handleDelete = async () => {
    if (!selected) return
    if (!confirm('Are you sure you want to permanently delete this event?')) return
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${selected.id}`, {
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
      <AppBreadcrumbs items={[{title: "Admin", href: "/admin" }, { title: "Events", href: "/admin/events" }, { title: "Archived Events" }]} />
      <div className="max-w-6xl mx-auto my-10">
        <h1 className="text-2xl font-bold mb-6">Archived Events</h1>
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : selected ? (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Archived Event Details</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 gap-4">
                      <Input type="text" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required placeholder="Event Name" />
                      <div className="flex gap-4">
                        <Input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} required placeholder="Start Date" />
                        <Input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} placeholder="End Date" />
                      </div>
                      <Textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder="Description" rows={3} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="submit" className="cursor-pointer">Save Changes</Button>
                      <Button type="button" variant="secondary" className="cursor-pointer" onClick={() => setEditMode(false)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <span className="font-semibold">Name:</span>
                      <span>{selected.name || 'N/A'}</span>
                      <span className="font-semibold">Start Date:</span>
                      <span>{selected.startDate ? selected.startDate.slice(0, 10) : 'N/A'}</span>
                      <span className="font-semibold">End Date:</span>
                      <span>{selected.endDate ? selected.endDate.slice(0, 10) : 'N/A'}</span>
                      <span className="font-semibold">Description:</span>
                      <span>{selected.description || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button className="cursor-pointer" onClick={() => setEditMode(true)}>Edit</Button>
                      <Button className="cursor-pointer bg-green-500 hover:bg-green-600 text-white" onClick={handleUnarchive}>Unarchive</Button>
                      <Button variant="destructive" className="cursor-pointer" onClick={handleDelete}>Delete</Button>
                      <Button variant="secondary" className="cursor-pointer" onClick={() => setSelected(null)}>Back</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.filter(e => e.isArchived).map(event => (
              <Card key={event.id} className="flex flex-col justify-between h-full">
                <CardHeader>
                  <CardTitle className="truncate">{event.name}</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(event.startDate, 'yyyy-MM-dd')}
                    {event.endDate && ` - ${format(event.endDate, 'yyyy-MM-dd')}`}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{event.description || 'No description.'}</p>
                </CardContent>
                <div className="flex gap-2 px-6 pb-4">
                  <Button size="sm" className="w-full cursor-pointer" onClick={() => setSelected(event)}>View / Edit</Button>
                  <Button size="sm" variant="destructive" className="w-full cursor-pointer" onClick={() => { setSelected(event); setEditMode(false); handleDelete(); }}>Delete</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
