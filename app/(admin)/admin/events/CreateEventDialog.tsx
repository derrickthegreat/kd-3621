"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

type EventModel = {
  id: string
  name: string
  startDate: string
  endDate?: string | null
  description?: string | null
  color?: string | null
}

export function CreateEventDialog({
  open,
  onOpenChange,
  canEdit,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  canEdit: boolean
  onCreated?: (ev: EventModel) => void
}) {
  const { getToken } = useAuth()
  const [busy, setBusy] = React.useState(false)
  const [form, setForm] = React.useState<{
    name: string
    startDate: string
    endDate: string
    description: string
    color: string
  }>({ name: "", startDate: "", endDate: "", description: "", color: "#3b82f6" })

  const invalidRange = React.useMemo(() => {
    if (!form.startDate || !form.endDate) return false
    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    return end.getTime() < start.getTime()
  }, [form.startDate, form.endDate])

  async function create() {
    if (!form.name || !form.startDate) {
      toast("Name and start date are required")
      return
    }
    if (invalidRange) {
      toast("End date must be on or after the start date")
      return
    }
    setBusy(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/v1/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          startDate: new Date(form.startDate).toISOString(),
          endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
          description: form.description || null,
          color: form.color || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to create event')
      toast('Event created')
      onCreated?.(data)
      onOpenChange(false)
      // reset form
      setForm({ name: "", startDate: "", endDate: "", description: "", color: "#3b82f6" })
    } catch (e: any) {
      toast(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Event</DialogTitle>
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
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                disabled={!canEdit}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">End</label>
              <Input
                type="datetime-local"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                disabled={!canEdit}
              />
              {invalidRange && (
                <p className="text-xs text-rose-600">End must be on or after the start date.</p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Color</label>
            <Input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={!canEdit}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={create} disabled={!canEdit || busy || invalidRange}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
