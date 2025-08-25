"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

export function AddAttributeDialog({ open, onOpenChange, onSaved }: { open: boolean, onOpenChange: (v:boolean)=>void, onSaved?: (created?: { id: string, name: string, isIconic?: boolean })=>void }) {
  const { getToken } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isIconic, setIsIconic] = useState(false)
  const [saving, setSaving] = useState(false)

  async function onSubmit() {
    try {
      setSaving(true)
      const token = await getToken(); if (!token) throw new Error('Unauthorized')
      if (!name) throw new Error('Name is required')
      const res = await fetch(`/api/v1/equipment/attributes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, description: description || undefined, isIconic })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to save')
      const created = Array.isArray(body?.attributes) ? body.attributes[0] : body?.attributes || null
      toast('Attribute saved')
      onOpenChange(false)
      onSaved && onSaved(created || undefined)
      setName(''); setDescription(''); setIsIconic(false)
    } catch (e:any) {
      toast(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Attribute</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Infantry Attack" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <Checkbox checked={isIconic} onCheckedChange={(v)=>setIsIconic(!!v)} />
            <span>Iconic attribute</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={()=>onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
