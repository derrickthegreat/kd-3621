"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SpecialitySelector } from "./speciality-selector"
import { RaritySelect } from "./rarity-select"

export type CommanderLike = {
  id: string
  name: string
  iconUrl: string
  speciality: string[]
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
}

export function AddCommanderDialog({ open, onOpenChange, onCreated }: { open: boolean, onOpenChange: (v: boolean) => void, onCreated: (c: CommanderLike) => void }) {
  const { getToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState("")
  const [iconUrl, setIconUrl] = useState("")
  const [spec, setSpec] = useState<string[]>([])
  const [rarity, setRarity] = useState<CommanderLike['rarity']>()

  async function save() {
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error("Unauthorized")
      const res = await fetch(`/api/v1/commander`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, iconUrl, speciality: spec, rarity })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to create commander')
      const created = (body.commander || body) as CommanderLike
      onCreated(created)
      onOpenChange(false)
      setName("")
      setIconUrl("")
      setSpec([])
      setRarity(undefined)
    } catch (e: any) {
      toast(e.message || 'Error creating commander')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Commander</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Joan of Arc" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Icon URL</label>
            <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://.../icon.png" />
          </div>
          <SpecialitySelector value={spec} onChange={setSpec} />
          <RaritySelect value={rarity} onChange={setRarity} />
        </div>
        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !name || !iconUrl || spec.length === 0}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
