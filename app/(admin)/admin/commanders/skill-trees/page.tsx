"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { HeaderActions } from "../../(components)/layout/HeaderActions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NameCell } from "@/components/admin/commanders/name-cell"
import { CommanderCombobox } from "@/components/admin/commanders/commander-combobox"
import { FileUploadDialog } from "@/app/components/FileUploadDialog"

type Commander = { id: string; name: string; iconUrl: string }
type SkillTree = { id: string; name: string; url: string; rating?: number | null; description?: string | null; commander: Commander }
type TableRow = SkillTree & { commanderName: string }
type SkillTreeUpload = { commanderid?: string; commander?: string; name?: string; url?: string; rating?: string | number; description?: string }

export default function SkillTreesPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<SkillTree[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [editing, setEditing] = useState<SkillTree | null>(null)

  function openEdit(tree: SkillTree) {
    setEditing(tree)
  }

  async function refresh() {
    try {
      const token = await getToken()
      if (!token) throw new Error('Unauthorized')
      const res = await fetch(`/api/v1/commander/skill-tree`, { headers: { Authorization: `Bearer ${token}` } })
      const body = await res.json().catch(() => ([]))
      if (!res.ok) throw new Error(body?.message || 'Failed to load skill trees')
      setRows(body as SkillTree[])
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const columns = useMemo<ColumnDef<TableRow>[]>(() => [
    {
      accessorKey: 'commanderName',
      header: 'Commander',
      cell: ({ row }) => (
        <NameCell name={row.original.commander.name} iconUrl={row.original.commander.iconUrl} />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Build Name',
    },
    {
      accessorKey: 'url',
      header: 'Image URL',
      cell: ({ row }) => (
        <a href={row.original.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate inline-block max-w-[360px]">{row.original.url}</a>
      )
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (row.original.rating ?? '')
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton label="Edit" icon="edit" onClick={() => openEdit(row.original)} />
          <IconButton label="Delete" icon="trash" onClick={() => deleteTree(row.original.id)} />
        </div>
      ),
    },
  ], [])

  async function deleteTree(id: string) {
    try {
      const token = await getToken(); if (!token) throw new Error('Unauthorized')
      const res = await fetch(`/api/v1/commander/skill-tree?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Delete failed')
      toast('Deleted')
      refresh()
    } catch (e: any) { toast(e.message || 'Delete failed') }
  }

  return (
    <>
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)}>Add Skill Tree</Button>
          <Button variant="outline" onClick={() => setUploadOpen(true)}>Upload</Button>
        </div>
      </HeaderActions>
      <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable<TableRow>
                data={rows.map(r => ({...r, commanderName: r.commander.name}))}
                columns={columns}
                loading={loading}
                error={error}
                pageSize={10}
                initialSorting={[{ id: 'commanderName', desc: false }]}
                searchable
                searchKeys={["commanderName","name","url"]}
                searchPlaceholder="Search commander, build name, or url"
              />
            </CardContent>
          </Card>
        )}
      </div>

      <AddSkillTreeDialog open={addOpen} onOpenChange={setAddOpen} onSaved={refresh} />
      <EditSkillTreeDialog open={!!editing} tree={editing} onOpenChange={(v) => { if (!v) setEditing(null) }} onSaved={refresh} />
      <FileUploadDialog<SkillTreeUpload>
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload Skill Trees"
        description="CSV, XLSX/XLS, or JSON. Columns: commanderid or commander (name), name, url, rating (0-5), description."
        accept=".csv,.xlsx,.xls,.json"
        parseFile={async (f) => parseSkillTreesFile(f)}
        onConfirm={async (items, onProgress) => {
          const token = await getToken(); if (!token) throw new Error('Unauthorized')
          const commanderList = await fetch(`/api/v1/commander`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => [])
          const byName = new Map<string, string>(Array.isArray(commanderList) ? commanderList.map((c: any) => [String(c.name).toLowerCase(), c.id]) : [])
          const chunkSize = 50
          let processed = 0
          const results: Array<{ ok: boolean; message?: string }> = []
          for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize)
            const uploads = chunk.map(async (it) => {
              let commanderId = it.commanderid?.trim()
              if (!commanderId && it.commander) commanderId = byName.get(String(it.commander).toLowerCase())
              const name = String(it.name || '').trim()
              const url = String(it.url || '').trim()
              const rating = it.rating == null || String(it.rating).trim() === '' ? undefined : Number(it.rating)
              const description = typeof it.description === 'string' ? it.description.trim() : undefined
              if (!commanderId || !name || !url) return { ok: false, message: 'Missing required fields' }
              const res = await fetch(`/api/v1/commander/skill-tree`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ commanderId, name, url, rating, description })
              })
              if (!res.ok) {
                const b = await res.json().catch(() => ({}))
                return { ok: false, message: b?.message || 'Failed' }
              }
              return { ok: true }
            })
            const part = await Promise.all(uploads)
            results.push(...part)
            processed += chunk.length
            onProgress && onProgress(processed, items.length)
          }
          const failed = results.filter(r => !r.ok)
          if (failed.length) toast(`${failed.length} row(s) failed; ${results.length - failed.length} succeeded`)
          else toast('Skill trees uploaded')
          await refresh()
        }}
        confirmLabel="Import"
      />
    </>
  )
}

function AddSkillTreeDialog({ open, onOpenChange, onSaved }: { open: boolean, onOpenChange: (v: boolean) => void, onSaved: () => void }) {
  const { getToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [options, setOptions] = useState<Commander[]>([])
  const [commanderId, setCommanderId] = useState<string | undefined>()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [rating, setRating] = useState<string>('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const token = await getToken(); if (!token) return
        const res = await fetch(`/api/v1/commander`, { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(() => ([]))
        if (!cancel && Array.isArray(body)) {
          const opts = (body as any[]).filter((c) => !c.isArchived).map((c) => ({ id: c.id, name: c.name, iconUrl: c.iconUrl }))
          setOptions(opts)
        }
      } catch {}
    })()
    return () => { cancel = true }
  }, [getToken])

  async function save() {
    setBusy(true)
    try {
      const nm = name.trim(); const u = url.trim(); const r = rating.trim()
      if (!commanderId || !nm || !u) throw new Error('Commander, name and url are required')
      const token = await getToken(); if (!token) throw new Error('Unauthorized')
      const payload: any = { commanderId, name: nm, url: u }
      if (r) payload.rating = Number(r)
      if (description.trim()) payload.description = description.trim()
      const res = await fetch(`/api/v1/commander/skill-tree`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to save')
      toast('Saved')
      onOpenChange(false)
      setCommanderId(undefined); setName(''); setUrl(''); setRating(''); setDescription('')
      onSaved()
    } catch (e: any) { toast(e.message || 'Error') } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Skill Tree</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Commander</Label>
            <CommanderCombobox value={commanderId} onChange={setCommanderId} options={options} placeholder="Select commander" />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Build Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Open Field" />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Image URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://... or /talent-trees/..." />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Rating (0-5)</Label>
            <Input type="number" min={0} max={5} step={0.1} value={rating} onChange={(e) => setRating(e.target.value)} placeholder="optional" />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !commanderId || !name.trim() || !url.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function IconButton({ label, onClick, icon }: { label: string, onClick: () => void, icon: 'trash' | 'edit' }) {
  const Icon = icon === 'trash' ? require('lucide-react').Trash : require('lucide-react').Pencil
  return (
    <Button variant="ghost" size="sm" aria-label={label} title={label} onClick={onClick}>
      <Icon className="h-4 w-4" />
    </Button>
  )
}

function EditSkillTreeDialog({ open, tree, onOpenChange, onSaved }: { open: boolean, tree: SkillTree | null, onOpenChange: (v: boolean) => void, onSaved: () => void }) {
  const { getToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState(tree?.name || '')
  const [url, setUrl] = useState(tree?.url || '')
  const [rating, setRating] = useState<string>(tree?.rating != null ? String(tree.rating) : '')
  const [description, setDescription] = useState(tree?.description || '')

  useEffect(() => {
    setName(tree?.name || '')
    setUrl(tree?.url || '')
    setRating(tree?.rating != null ? String(tree.rating) : '')
    setDescription(tree?.description || '')
  }, [tree])

  async function save() {
    if (!tree) return
    setBusy(true)
    try {
      const token = await getToken(); if (!token) throw new Error('Unauthorized')
      const payload: any = { id: tree.id, name: name.trim(), url: url.trim() }
      if (rating.trim() !== '') payload.rating = Number(rating)
      else payload.rating = null
      if (description.trim()) payload.description = description.trim(); else payload.description = ''
      const res = await fetch(`/api/v1/commander/skill-tree`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to update')
      toast('Updated')
      onOpenChange(false)
      onSaved()
    } catch (e: any) { toast(e.message || 'Error') } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Skill Tree</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Commander</Label>
            <div className="text-sm text-muted-foreground">{tree?.commander.name}</div>
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Build Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Image URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Rating (0-5)</Label>
            <Input type="number" min={0} max={5} step={0.1} value={rating} onChange={(e) => setRating(e.target.value)} placeholder="optional" />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="optional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !name.trim() || !url.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

async function parseSkillTreesFile(file: File): Promise<SkillTreeUpload[]> {
  const name = file.name.toLowerCase()
  const ext = name.split('.').pop() || ''
  if (ext === 'csv') {
    const text = await file.text()
    const rows = text.split(/\r?\n/).filter(Boolean)
    if (!rows.length) return []
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase())
    const idx = {
      commanderid: headers.indexOf('commanderid'),
      commander: headers.indexOf('commander'),
      name: headers.indexOf('name'),
      url: headers.indexOf('url'),
      rating: headers.indexOf('rating'),
      description: headers.indexOf('description'),
    }
    return rows.slice(1).map((line) => {
      const cols = line.split(',')
      return {
        commanderid: idx.commanderid >= 0 ? cols[idx.commanderid]?.trim() : undefined,
        commander: idx.commander >= 0 ? cols[idx.commander]?.trim() : undefined,
        name: idx.name >= 0 ? cols[idx.name]?.trim() : undefined,
        url: idx.url >= 0 ? cols[idx.url]?.trim() : undefined,
        rating: idx.rating >= 0 ? cols[idx.rating]?.trim() : undefined,
        description: idx.description >= 0 ? cols[idx.description]?.trim() : undefined,
      }
    }).filter(r => r.commanderid || r.commander || r.name || r.url)
  } else if (ext === 'xlsx' || ext === 'xls') {
    const ab = await file.arrayBuffer()
    const XLSXMod = await import('xlsx')
    const XLSX: any = (XLSXMod as any).default || XLSXMod
    const wb = XLSX.read(ab, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
    return json.map((row) => ({
      commanderid: String(row.commanderid || row.CommanderId || row.CommanderID || row.COMMANDERID || '').trim() || undefined,
      commander: String(row.commander || row.Commander || '').trim() || undefined,
      name: String(row.name || row.Name || '').trim() || undefined,
      url: String(row.url || row.URL || row.Url || '').trim() || undefined,
      rating: String(row.rating ?? row.Rating ?? '').trim() || undefined,
      description: String(row.description ?? row.Description ?? '').trim() || undefined,
    })).filter(r => r.commanderid || r.commander || r.name || r.url)
  } else if (ext === 'json') {
    const text = await file.text()
    try {
      const arr = JSON.parse(text)
      if (!Array.isArray(arr)) return []
      return arr.map((r: any) => ({
        commanderid: String(r.commanderid || '').trim() || undefined,
        commander: String(r.commander || '').trim() || undefined,
        name: String(r.name || '').trim() || undefined,
        url: String(r.url || '').trim() || undefined,
        rating: r.rating,
        description: String(r.description || '').trim() || undefined,
      })).filter(r => r.commanderid || r.commander || r.name || r.url)
    } catch {
      return []
    }
  }
  toast('Unsupported file type. Please upload CSV, XLSX/XLS, or JSON')
  return []
}
