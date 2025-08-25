"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type EventModel = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  color?: string | null
}

export function EventQuickDialog({
  open,
  onOpenChange,
  event,
  canEdit,
  onUpdated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  event: EventModel | null
  canEdit: boolean
  onUpdated?: (ev: EventModel) => void
}) {
  const { getToken } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [form, setForm] = React.useState<EventModel | null>(event)

  React.useEffect(() => setForm(event), [event])

  async function save() {
    if (!form) return
    setBusy(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events/${form.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          description: form.description,
          color: form.color,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to update event')
      toast('Event updated')
      onUpdated?.(data.event)
      onOpenChange(false)
    } catch (e: any) {
      toast(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!form) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Start</label>
              <Input
                type="datetime-local"
                value={form.startDate ? new Date(form.startDate).toISOString().slice(0,16) : ''}
                onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })}
                disabled={!canEdit}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">End</label>
              <Input
                type="datetime-local"
                value={form.endDate ? new Date(form.endDate).toISOString().slice(0,16) : ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Color</label>
            <Input
              type="color"
              value={form.color || '#3b82f6'}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={!canEdit}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between">
          <Button variant="secondary" onClick={() => form && router.push(`/admin/events/${form.id}`)}>
            View details
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Close</Button>
            <Button onClick={save} disabled={!canEdit || busy}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
