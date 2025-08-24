"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AddMaterialDialog({ open, onOpenChange, onSaved }: { open: boolean, onOpenChange: (v:boolean)=>void, onSaved?: (created?: { id: string, name: string })=>void }) {
  const { getToken } = useAuth()
  const [name, setName] = useState('')
  const [src, setSrc] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit() {
    try {
      setSaving(true)
      const token = await getToken(); if (!token) throw new Error('Unauthorized')
      if (!name) throw new Error('Name is required')
      const res = await fetch(`/api/v1/equipment/materials`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, src: src || undefined, description: description || undefined })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to save')
      const created = Array.isArray(body?.materials) ? body.materials[0] : body?.materials || null
      toast('Material saved')
      onOpenChange(false)
      onSaved && onSaved(created || undefined)
      setName(''); setSrc(''); setDescription('')
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
          <DialogTitle>Add Material</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Iron Ore" />
          </div>
          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input value={src} onChange={(e)=>setSrc(e.target.value)} placeholder="/icons/materials/iron_ore_normal.png" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Optional description" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={()=>onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
