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

  const handleClose = async () => {
    if (!confirm('Are you sure you want to archive this event?')) return
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
        body: JSON.stringify({ isArchived: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast(data.message || 'Failed to archive event', { position: 'top-center' })
        throw new Error(data.message || 'Failed to archive event')
      }
      toast('Event has been archived', { position: 'top-center' })
      router.push('/admin/events/archived')
    } catch (err: any) {
      setError(err.message)
      toast(err.message, { position: 'top-center' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this event?')) return
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events?id=${id}`, {
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
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-4">
                  <Input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Event Name" />
                  <div className="flex gap-4">
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required placeholder="Start Date" />
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="End Date" />
                  </div>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={3} />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                <div className="flex gap-2 justify-end">
                  <Button type="submit" disabled={loading} className="cursor-pointer">{loading ? 'Saving...' : 'Save Changes'}</Button>
                  <Button type="button" variant="secondary" className="cursor-pointer" onClick={() => setEditMode(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <span className="font-semibold">Name:</span>
                  <span>{event.name || 'N/A'}</span>
                  <span className="font-semibold">Start Date:</span>
                  <span>{event.startDate ? event.startDate.slice(0, 10) : 'N/A'}</span>
                  <span className="font-semibold">End Date:</span>
                  <span>{event.endDate ? event.endDate.slice(0, 10) : 'N/A'}</span>
                  <span className="font-semibold">Description:</span>
                  <span>{event.description || 'N/A'}</span>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button className="cursor-pointer" onClick={() => setEditMode(true)}>Edit</Button>
                  <Button className="cursor-pointer bg-yellow-400 hover:bg-yellow-500 text-black" onClick={handleClose}>Archive</Button>
                  <Button variant="destructive" className="cursor-pointer" onClick={handleDelete}>Delete</Button>
                  <Link href="/admin/events">
                    <Button variant="secondary" className="cursor-pointer">Back</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
