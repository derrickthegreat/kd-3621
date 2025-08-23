'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { AppBreadcrumbs } from '../../(components)/layout/AppBeadcrumbs'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Event = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
}

export default function AddEventPage() {
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch('/api/v1/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, startDate, endDate, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create event');
      }
      router.push('/admin/events');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppBreadcrumbs items={[{title: "Admin", href: "/admin" }, { title: "Events", href: "/admin/events" }, { title: "Add Event" }]} />
      <div className="max-w-2xl mx-auto my-10">
        <Card>
          <CardHeader>
            <CardTitle>Add Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4">
                <Input type="text" placeholder="Event Name" value={name} onChange={e => setName(e.target.value)} required />
                <div className="flex gap-4">
                  <Input type="date" placeholder="Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                  <Input type="date" placeholder="End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
              </div>
              {error && <p className="text-red-500">{error}</p>}
              <div className="flex gap-2 justify-end">
                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Event'}</Button>
                <Link href="/admin/events"><Button variant="secondary" type="button">Cancel</Button></Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
