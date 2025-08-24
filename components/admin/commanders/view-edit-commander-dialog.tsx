"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SpecialitySelector } from "./speciality-selector"
import { RaritySelect } from "./rarity-select"
import { Eye, ExternalLink, Trash, RotateCcw } from "lucide-react"

export type CommanderLike = {
  id: string
  name: string
  iconUrl: string
  speciality: string[]
  isArchived?: boolean
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
}

function getSlugFromUrl(url: string) {
  const file = (url || '').split('/').pop() || ''
  return file.replace(/\.[a-zA-Z0-9]+$/, '')
}

export function ViewEditCommanderDialog({ open, mode, commander, onOpenChange, onSaved }: { open: boolean, mode: 'view' | 'edit', commander: CommanderLike | null, onOpenChange: (v: boolean) => void, onSaved: () => void }) {
  const { getToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(commander?.name || '')
  const [iconUrl, setIconUrl] = useState(commander?.iconUrl || '')
  const [spec, setSpec] = useState<string[]>(commander?.speciality || [])
  const [rarity, setRarity] = useState<CommanderLike['rarity']>(commander?.rarity)
  const [pairings, setPairings] = useState<Array<{ id: string, primary: { id: string, name: string, iconUrl: string }, secondary: { id: string, name: string, iconUrl: string } }>>([])
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [skillTrees, setSkillTrees] = useState<Array<{ id: string; name: string; url: string }>>([])
  const [loadingTrees, setLoadingTrees] = useState(false)
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Set<string>>(new Set())

  async function deleteSkillTree(id: string) {
    try {
      const token = await getToken(); if (!token) throw new Error('Unauthorized')
      const res = await fetch(`/api/v1/commander/skill-tree?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to delete')
      setSkillTrees((prev) => prev.filter((t) => t.id !== id))
      toast('Deleted')
    } catch (e: any) {
      toast(e.message || 'Delete failed')
    }
  }

  useEffect(() => {
    setName(commander?.name || '')
    setIconUrl(commander?.iconUrl || '')
    setSpec(commander?.speciality || [])
    setRarity(commander?.rarity)
    // Load pairings and skill trees for this commander
    let cancel = false
    async function loadPairs() {
      if (!commander?.id) return
      setLoadingPairs(true)
      try {
        const token = await getToken()
        if (!token) return
        const res = await fetch(`/api/v1/commander/pairing`, { headers: { Authorization: `Bearer ${token}` } })
        const list = await res.json().catch(() => ([]))
        if (!cancel && Array.isArray(list)) {
          const mine = list.filter((p: any) => p.primary?.id === commander.id || p.secondary?.id === commander.id)
          setPairings(mine)
        }
      } finally {
        setLoadingPairs(false)
      }
    }
    async function loadSkillTrees() {
      if (!commander?.id) return
      setLoadingTrees(true)
      try {
        const token = await getToken(); if (!token) return
        const res = await fetch(`/api/v1/commander/skill-tree?commanderId=${encodeURIComponent(commander.id)}`, { headers: { Authorization: `Bearer ${token}` } })
        const list = await res.json().catch(() => ([]))
        if (!cancel && Array.isArray(list)) {
          setSkillTrees(list.map((t: any) => ({ id: t.id, name: t.name, url: t.url })))
        }
      } finally {
        setLoadingTrees(false)
      }
    }
  loadPairs()
  loadSkillTrees()
  setPendingDelete(new Set())
    return () => { cancel = true }
  }, [commander])

  async function save() {
    if (!commander) return
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Unauthorized')
      const res = await fetch(`/api/v1/commander?id=${encodeURIComponent(commander.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, iconUrl, speciality: spec, rarity })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to update commander')

      // Commit pending skill tree deletions
      if (pendingDelete.size) {
        const ids = Array.from(pendingDelete)
        const deletes = ids.map(async (id) => {
          const r = await fetch(`/api/v1/commander/skill-tree?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
          return r.ok
        })
        const results = await Promise.allSettled(deletes)
        const failures = results.filter(r => r.status === 'fulfilled' ? !r.value : true).length
        if (failures) toast(`${failures} deletion(s) failed`)
      }

      toast('Commander updated')
      onSaved()
      onOpenChange(false)
    } catch (e: any) {
      toast(e.message || 'Error updating commander')
    } finally {
      setBusy(false)
    }
  }

  const readOnly = mode === 'view'
  const slug = getSlugFromUrl(iconUrl || commander?.iconUrl || '')

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'view' ? 'View Commander' : 'Edit Commander'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={iconUrl} alt={name} />
              <AvatarFallback>{(name || '?').slice(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Icon URL</label>
            <Input value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} disabled={readOnly} />
          </div>
          <RaritySelect value={rarity} onChange={setRarity} disabled={readOnly} />
          <SpecialitySelector value={spec} onChange={setSpec} disabled={readOnly} />
          {/* Pairings section moved below metadata */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Pairings</label>
            </div>
            <div className="rounded-md border divide-y">
              {loadingPairs ? (
                <div className="p-3 text-sm text-muted-foreground">Loading…</div>
              ) : pairings.length ? (
                pairings.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-2">
                    <div className="flex items-center gap-3">
                      <Mini name={p.primary.name} iconUrl={p.primary.iconUrl} />
                      <span className="text-muted-foreground">→</span>
                      <Mini name={p.secondary.name} iconUrl={p.secondary.iconUrl} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" title="Delete pairing" aria-label="Delete pairing" onClick={() => deletePairing(p.id)}>
                        {/* trash icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9 3h6a1 1 0 0 1 1 1v1h4v2H4V5h4V4a1 1 0 0 1 1-1Zm-1 6h2v9H8V9Zm4 0h2v9h-2V9Z" /></svg>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground">No pairings yet.</div>
              )}
            </div>
          </div>

          {/* Skill Trees section */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Skill Trees</label>
            </div>
            <div className="rounded-md border divide-y">
              {loadingTrees ? (
                <div className="p-3 text-sm text-muted-foreground">Loading…</div>
              ) : skillTrees.length ? (
                skillTrees.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-2 p-2">
                    <div className="flex items-center gap-3">
                      <span className={"text-sm " + (pendingDelete.has(t.id) ? 'line-through opacity-60' : '')}>{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" aria-label="View" title="View" onClick={() => setPreview({ name: t.name, url: t.url })}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Open in new tab" title="Open in new tab" asChild>
                        <a href={t.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      {mode === 'edit' && (
                        pendingDelete.has(t.id) ? (
                          <Button size="icon" variant="ghost" aria-label="Restore" title="Restore" onClick={() => { setPendingDelete((prev) => { const s = new Set(prev); s.delete(t.id); return s }) }}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="icon" variant="ghost" aria-label="Delete" title="Delete" onClick={() => setConfirmDelete({ id: t.id, name: t.name })}>
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-muted-foreground">No skill trees yet.</div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between gap-2">
          <div>
            {slug ? (
              <Button variant="secondary" asChild>
                <Link href={`/builds/${slug}`} target="_blank">View on site</Link>
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Close</Button>
            {mode === 'edit' && (
              <Button onClick={save} disabled={busy || !name || !iconUrl || spec.length === 0}>Save</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* Preview dialog */}
    <Dialog open={!!preview} onOpenChange={(v) => { if (!v) setPreview(null) }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{preview?.name}</DialogTitle>
        </DialogHeader>
        {preview ? (
          <div className="w-full overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview!.url} alt={preview!.name} className="max-h-[70vh] w-auto mx-auto" />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    {/* Confirm delete dialog (marks for deletion; applied on Save) */}
    <Dialog open={!!confirmDelete} onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete skill tree?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">“{confirmDelete?.name}” will be removed when you click Save.</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => { if (confirmDelete) { setPendingDelete((prev) => { const s = new Set(prev); s.add(confirmDelete.id); return s }); setConfirmDelete(null) } }}>Mark delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

function Mini({ name, iconUrl }: { name: string, iconUrl: string }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={iconUrl} alt={name} />
        <AvatarFallback className="text-[10px]">{(name || '?').slice(0,1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="text-sm">{name}</span>
    </span>
  )
}

function setModeEdit() {
  // Placeholder helper for potential mode toggle button; no-op here since mode comes from parent
}

async function deletePairing(id: string) {
  try {
    const res = await fetch(`/api/v1/commander/pairing?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete pairing')
    // Note: parent refreshes on dialog onSaved; here we rely on closing/reopen or user action
  } catch {
    // swallow
  }
}
