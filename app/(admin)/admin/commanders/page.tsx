"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { HeaderActions } from "../(components)/layout/HeaderActions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileUploadDialog } from "@/app/components/FileUploadDialog"
import { Eye, Pencil, Archive } from "lucide-react"
import { TROOP_TYPES, SPEC_LABELS } from "@/components/admin/commanders/constants"
import { NameCell } from "@/components/admin/commanders/name-cell"
import { RaritySelect, formatRarityLabel } from "@/components/admin/commanders/rarity-select"
import { SpecialitySelector } from "@/components/admin/commanders/speciality-selector"
import { AddCommanderDialog as AddCommanderDialogExtracted } from "@/components/admin/commanders/add-commander-dialog"
import { ViewEditCommanderDialog as ViewEditCommanderDialogExtracted } from "@/components/admin/commanders/view-edit-commander-dialog"

type Commander = {
  id: string
  name: string
  iconUrl: string
  speciality: string[]
  isArchived?: boolean
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
}

// constants moved to components/admin/commanders/constants

export default function CommandersPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<Commander[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view')
  const [selected, setSelected] = useState<Commander | null>(null)

  useEffect(() => {
    let cancel = false
    async function load() {
      try {
        const token = await getToken()
        if (!token) throw new Error("Unauthorized")
        const res = await fetch(`/api/v1/commander`, { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(() => ([]))
        if (!res.ok) throw new Error(body?.message || "Failed to load commanders")
        if (!cancel) setRows(body as Commander[])
      } catch (e: any) {
        if (!cancel) setError(e.message || "Error")
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [getToken])

  

  const columns = useMemo<ColumnDef<Commander>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const { name, iconUrl } = row.original
        const initials = (name || "?")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("") || "?"
  return <NameCell name={name} iconUrl={iconUrl} />
      },
    },
    {
      id: 'rarity',
      header: 'Rarity',
      accessorFn: (r) => r.rarity || '',
      cell: ({ row }) => {
  return <span className="text-sm text-muted-foreground">{formatRarityLabel(row.original.rarity)}</span>
      },
    },
    {
      id: "speciality",
      header: "Speciality",
      accessorFn: (r) => (r.speciality || []).join(", "),
      cell: ({ row }) => {
        const labels = (row.original.speciality || []).map((s) => SPEC_LABELS[s] || (s || '').toLowerCase().replace(/(^|\s)\S/g, (m) => m.toUpperCase()))
        return <span className="text-sm text-muted-foreground">{labels.join(', ')}</span>
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="View"
            onClick={() => { setSelected(row.original); setDialogMode('view'); setDialogOpen(true) }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            onClick={() => { setSelected(row.original); setDialogMode('edit'); setDialogOpen(true) }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Archive"
            onClick={async () => {
              try {
                const token = await getToken()
                if (!token) throw new Error('Unauthorized')
                const res = await fetch(`/api/v1/commander?id=${encodeURIComponent(row.original.id)}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ isArchived: true })
                })
                if (!res.ok) throw new Error('Failed to archive')
                // Refresh list
                const listRes = await fetch(`/api/v1/commander`, { headers: { Authorization: `Bearer ${token}` } })
                const listBody = await listRes.json().catch(() => ([]))
                if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Commander[])
                toast('Archived')
              } catch (e: any) {
                toast(e.message || 'Archive failed')
              }
            }}
          >
            <Archive className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [])

  return (
    <>
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)}>Add Commander</Button>
          <Button variant="secondary" onClick={() => setUploadOpen(true)}>Upload Commander(s)</Button>
          <label className="ml-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={showArchived} onCheckedChange={(v) => setShowArchived(!!v)} />
            <span>Show archived</span>
          </label>
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
              <DataTable<Commander>
                data={rows.filter((r) => showArchived || !r.isArchived)}
                columns={columns}
                loading={loading}
                error={error}
                pageSize={10}
                searchable
                searchKeys={["name"]}
                searchPlaceholder="Search commanders by name"
                excludeFromVisibilityToggle={["actions"]}
                initialSorting={[{ id: "name", desc: false }]}
              />
            </CardContent>
          </Card>
        )}
      </div>

  <AddCommanderDialogExtracted
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(created) => {
          const prevCount = rows.length
          ;(async () => {
            try {
              const token = await getToken()
              if (!token) return
              const listRes = await fetch(`/api/v1/commander`, { headers: { Authorization: `Bearer ${token}` } })
              const listBody = await listRes.json().catch(() => ([]))
              if (listRes.ok && Array.isArray(listBody)) {
                setRows(listBody as Commander[])
                const added = Math.max(0, (listBody as Commander[]).length - prevCount)
                toast(`Added ${added} commander${added === 1 ? '' : 's'}. Refreshed list.`)
              } else if (created) {
                // Fallback: merge by id
                setRows((prev) => {
                  const byId = new Map(prev.map((r) => [r.id, r]))
                  byId.set(created.id, created)
                  const merged = Array.from(byId.values())
                  const added = Math.max(0, merged.length - prev.length)
                  toast(`Added ${added} commander${added === 1 ? '' : 's'}. Refreshed list.`)
                  return merged
                })
              }
            } catch {
              // ignore
            }
          })()
        }}
  />

      <FileUploadDialog<Commander>
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload Commanders"
  description="CSV, XLSX/XLS, or JSON (array). Shape: { name, image, rarity, attributes[], builds[] }. We'll map image→iconUrl and attributes→speciality (max 3)."
        accept=".csv,.xlsx,.xls,.json"
        allowMultiple
        parseFile={async (f) => parseCommanderFile(f)}
        onConfirm={async (items, onProgress) => {
          const prevCount = rows.length
          const token = await getToken()
          if (!token) throw new Error('Unauthorized')
          // Chunk uploads to keep requests responsive and update progress
          const payload = items.map(({ id, ...r }) => r)
          const chunkSize = 25
          let processed = 0
          let result: Commander[] = []
          let totalErrors: any[] = []
          for (let i = 0; i < payload.length; i += chunkSize) {
            const chunk = payload.slice(i, i + chunkSize)
            const res = await fetch(`/api/v1/commander`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(chunk)
            })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) {
              const firstErr = Array.isArray(body?.errors) && body.errors.length ? ` (${body.errors[0].message})` : ''
              throw new Error((body?.message || 'Failed to upload commanders') + firstErr)
            }
            const part = (Array.isArray(body.commander) ? body.commander : []) as Commander[]
            if (part?.length) result = result.concat(part)
            if (Array.isArray(body?.errors) && body.errors.length) totalErrors = totalErrors.concat(body.errors)
            processed += chunk.length
            onProgress && onProgress(processed, payload.length)
          }
          if (totalErrors.length) {
            const failed = totalErrors.length
            toast(`${failed} commander${failed===1?'':'s'} failed to import${totalErrors[0]?.message ? `: ${totalErrors[0].message}` : ''}`)
          }
          // Prefer refetching from the server to avoid client-side duplicates
          try {
            const listRes = await fetch(`/api/v1/commander`, { headers: { Authorization: `Bearer ${token}` } })
            const listBody = await listRes.json().catch(() => ([]))
            if (listRes.ok && Array.isArray(listBody)) {
              setRows(listBody as Commander[])
              const added = Math.max(0, (listBody as Commander[]).length - prevCount)
              toast(`Added ${added} commander${added === 1 ? '' : 's'}. Refreshed list.`)
            } else if (result.length) {
              // Fallback: merge result into existing rows by id (replace or add)
              setRows((prev) => {
                const byId = new Map(prev.map((r) => [r.id, r]))
                for (const r of result) byId.set(r.id, r)
                const merged = Array.from(byId.values())
                const added = Math.max(0, merged.length - prev.length)
                toast(`Added ${added} commander${added === 1 ? '' : 's'}. Refreshed list.`)
                return merged
              })
            } else {
              // Last resort: merge by normalized name in case server returned nothing special
              setRows((prev) => {
                const norm = (s: string) => (s || '').trim().toLowerCase()
                const byName = new Map(prev.map((r) => [norm(r.name), r]))
                for (const it of items) byName.set(norm(it.name), it)
                const merged = Array.from(byName.values())
                const added = Math.max(0, merged.length - prev.length)
                toast(`Added ${added} commander${added === 1 ? '' : 's'}. Refreshed list.`)
                return merged
              })
            }
          } catch {
            // If refetch fails, still update optimistically by id
            if (result.length) {
              setRows((prev) => {
                const byId = new Map(prev.map((r) => [r.id, r]))
                for (const r of result) byId.set(r.id, r)
                const merged = Array.from(byId.values())
                const added = Math.max(0, merged.length - prev.length)
                toast(`Added ${added} commander${added === 1 ? '' : 's'}. Refreshed list.`)
                return merged
              })
            }
          }
        }}
        confirmLabel="Upload"
      />

  <ViewEditCommanderDialogExtracted
        open={dialogOpen}
        mode={dialogMode}
        commander={selected}
        onOpenChange={setDialogOpen}
        onSaved={async () => {
          // Refetch after save
          const token = await getToken()
          if (!token) return
          const listRes = await fetch(`/api/v1/commander`, { headers: { Authorization: `Bearer ${token}` } })
          const listBody = await listRes.json().catch(() => ([]))
          if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Commander[])
        }}
  />
    </>
  )
}

// inlined AddCommanderDialog has been extracted

async function parseCommanderFile(f: File): Promise<Commander[]> {
  function normalizeSpecs(raw: string | string[]): string[] {
    const parts = Array.isArray(raw) ? raw : String(raw).split(/[;|,]/)
    const MAP: Record<string, string> = {
      archer: 'ARCHERY', archery: 'ARCHERY',
      infantry: 'INFANTRY',
      cavalry: 'CAVALRY',
      leadership: 'LEADERSHIP',
      peacekeeping: 'PEACEKEEPING',
  attack: 'ATTACK',
      conquering: 'CONQUERING',
      combo: 'COMBO',
      defense: 'DEFENSE', defence: 'DEFENSE',
      garrison: 'GARRISON',
      skill: 'SKILL',
      smite: 'SMITE',
      support: 'SUPPORT',
      versatility: 'VERSATILITY',
      engineering: 'ENGINEERING',
      gathering: 'GATHERING',
    }
    const mapped = parts
      .map((s) => String(s).trim())
      .filter(Boolean)
      .map((s) => MAP[s.toLowerCase()] || s.toUpperCase())
    return Array.from(new Set(mapped))
      .filter((s) => (TROOP_TYPES as readonly string[]).includes(s))
      .slice(0, 3)
  }
  function normalizeRarity(raw: any): Commander['rarity'] | undefined {
    const v = String(raw || '').trim().toUpperCase()
    if (!v) return undefined
    const MAP: Record<string, Commander['rarity']> = {
      COMMON: 'COMMON',
      UNCOMMON: 'UNCOMMON',
      RARE: 'RARE',
      EPIC: 'EPIC',
      LEGENDARY: 'LEGENDARY',
    }
    return MAP[v]
  }
  function imageToIconUrl(image: string): string {
    const val = String(image || '').trim()
    if (!val) return ''
    if (val.startsWith('http') || val.startsWith('/')) return val
  return `/icons/commanders/${val}`
  }
    const ext = f.name.toLowerCase().split('.').pop() || ''
    if (ext === 'csv') {
      const text = await f.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      const headers = lines.shift()!.split(',').map((h) => h.trim().toLowerCase())
    const iName = headers.indexOf('name')
    const iIcon = headers.indexOf('iconurl')
    const iImage = headers.indexOf('image')
    const iAttrs = headers.indexOf('attributes')
    const iSpec = headers.indexOf('speciality')
  const out: Commander[] = []
      for (const line of lines) {
        const cols = line.split(',')
  const attrsRaw = iAttrs >= 0 ? cols[iAttrs] : (iSpec >= 0 ? cols[iSpec] : '')
  const rarity = normalizeRarity(cols[headers.indexOf('rarity')])
      const spec = normalizeSpecs(attrsRaw)
      const rawImage = iImage >= 0 ? cols[iImage] : ''
      const iconUrl = (cols[iIcon]?.trim()) || imageToIconUrl(rawImage)
  out.push({ id: crypto.randomUUID(), name: cols[iName]?.trim() || '', iconUrl, speciality: spec, rarity })
      }
  return out.filter((r) => r.name && r.iconUrl)
    } else if (ext === 'xlsx' || ext === 'xls') {
      const XLSXMod = await import('xlsx')
      const XLSX: any = (XLSXMod as any).default || XLSXMod
      const ab = await f.arrayBuffer()
      const wb = XLSX.read(ab, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
  const out: Commander[] = json.map((row: any) => {
      const spec = normalizeSpecs(row.attributes || row.Attributes || row.SPECIALITY || row.speciality || '')
      const image = row.image || row.Image || ''
      const iconUrl = String(row.iconUrl || row.IconUrl || row.icon || imageToIconUrl(image)).trim()
  const rarity = normalizeRarity(row.rarity || row.Rarity)
  return { id: crypto.randomUUID(), name: String(row.name || row.Name || '').trim(), iconUrl, speciality: spec, rarity }
      })
  return out.filter((r) => r.name && r.iconUrl)
    } else if (ext === 'json') {
      try {
        const text = await f.text()
        const arr = JSON.parse(text)
        if (!Array.isArray(arr)) {
          toast('JSON must be an array of commanders')
          return []
        }
        const out: Commander[] = arr.map((row: any) => {
        const spec = normalizeSpecs(row.attributes || row.speciality || row.spec || [])
        const iconUrl = imageToIconUrl(row.image || row.iconUrl || row.icon || '')
          const rarity = normalizeRarity(row.rarity)
          return {
            id: crypto.randomUUID(),
            name: String(row.name || '').trim(),
          iconUrl,
            speciality: spec,
            rarity,
          }
        })
  return out.filter((r) => r.name && r.iconUrl)
      } catch {
        toast('Invalid JSON file')
        return []
      }
    } else {
      toast('Unsupported file type. Please upload CSV, XLSX/XLS, or JSON')
      return []
    }
}

function getSlugFromUrl(url: string) {
  const file = (url || '').split('/').pop() || ''
  return file.replace(/\.[a-zA-Z0-9]+$/, '')
}

// inlined ViewEditCommanderDialog has been extracted
