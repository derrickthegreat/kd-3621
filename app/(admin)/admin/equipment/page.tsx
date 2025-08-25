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
import { HeaderActions } from "../(components)/layout/HeaderActions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileUploadDialog } from "@/app/components/FileUploadDialog"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { AddAttributeDialog } from "@/components/admin/equipment/AddAttributeDialog"
import { AddMaterialDialog } from "@/components/admin/equipment/AddMaterialDialog"

type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY"
type Slot = "HEAD" | "CHEST" | "HANDS" | "FEET" | "WEAPON" | "ACCESSORY"

type Equipment = {
  id: string
  name: string
  src: string
  alt?: string | null
  slot: Slot
  rarity: Rarity
}

type Attr = { id: string, name: string, isIconic?: boolean }
type Mat = { id: string, name: string }

type NormalAttrForm = { attributeId: string; value?: string }
type IconicAttrForm = { attributeId: string; value?: string; tier?: number }
type MaterialForm = { materialId: string; rarity?: Rarity | null; quantity?: number }

const SLOT_LABELS: Record<Slot, string> = {
  HEAD: "Head",
  CHEST: "Chest",
  HANDS: "Hands",
  FEET: "Feet",
  WEAPON: "Weapon",
  ACCESSORY: "Accessory",
}

const RARITY_LABELS: Record<Rarity, string> = {
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
}

export default function EquipmentPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Equipment | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [toDelete, setToDelete] = useState<Equipment | null>(null)

  useEffect(() => {
    let cancel = false
    async function load() {
      try {
        const token = await getToken()
        if (!token) throw new Error("Unauthorized")
        const res = await fetch(`/api/v1/equipment`, { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(() => ([]))
        if (!res.ok) throw new Error(body?.message || "Failed to load equipment")
        if (!cancel) setRows(body as Equipment[])
      } catch (e: any) {
        if (!cancel) setError(e.message || "Error")
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [getToken])

  const columns = useMemo<ColumnDef<Equipment>[]>(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const { name, src } = row.original
        const initials = (name || "?")
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join("") || "?"
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={src} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              <span className="text-xs text-muted-foreground">{row.original.alt || ""}</span>
            </div>
          </div>
        )
      },
    },
    {
      id: "slot",
      header: "Slot",
      accessorFn: (r) => r.slot,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{SLOT_LABELS[row.original.slot]}</span>
      ),
    },
    {
      id: "rarity",
      header: "Rarity",
      accessorFn: (r) => r.rarity,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{RARITY_LABELS[row.original.rarity]}</span>
      ),
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
            onClick={() => { setSelected(row.original); setDialogOpen(true) }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            onClick={() => { setSelected(row.original); setAddOpen(true) }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            onClick={()=>{ setToDelete(row.original); setConfirmOpen(true) }}
          >
            <Trash2 className="h-4 w-4" />
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
          <Button onClick={() => { setSelected(null); setAddOpen(true) }}>Add Equipment</Button>
          <Button variant="secondary" onClick={() => setUploadOpen(true)}>Upload Equipment</Button>
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
              <DataTable<Equipment>
                data={rows}
                columns={columns}
                loading={loading}
                error={error}
                pageSize={10}
                searchable
                searchKeys={["name", "alt"]}
                searchPlaceholder="Search equipment by name"
                excludeFromVisibilityToggle={["actions"]}
                initialSorting={[{ id: "name", desc: false }]}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete equipment?"
        description={toDelete ? `Delete "${toDelete.name}"? This cannot be undone.` : undefined}
        confirmText="Delete"
        confirmVariant="destructive"
        loading={confirmBusy}
        onConfirm={async ()=>{
          if (!toDelete) return
          setConfirmBusy(true)
          try {
            const token = await getToken(); if (!token) throw new Error('Unauthorized')
            const res = await fetch(`/api/v1/equipment?id=${encodeURIComponent(toDelete.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(body?.message || 'Failed to delete')
            const listRes = await fetch(`/api/v1/equipment`, { headers: { Authorization: `Bearer ${token}` } })
            const listBody = await listRes.json().catch(() => ([]))
            if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Equipment[])
            toast('Deleted')
            setConfirmOpen(false)
          } catch (e:any) { toast(e.message || 'Delete failed') }
          finally { setConfirmBusy(false); setToDelete(null) }
        }}
      />

      <AddEditEquipmentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        equipment={selected}
        onSaved={async () => {
          const token = await getToken(); if (!token) return
          const listRes = await fetch(`/api/v1/equipment`, { headers: { Authorization: `Bearer ${token}` } })
          const listBody = await listRes.json().catch(() => ([]))
          if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Equipment[])
        }}
      />

      <FileUploadDialog<Equipment>
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload Equipment"
        description="CSV, XLSX/XLS, or JSON (array). Shape: { name, slot, rarity, src, alt }. JSON may also include attributes/iconic/materials by name: attributesByName[{ name, value }], iconicByName[{ name, value, tier }], materialsByName[{ name, rarity, quantity }], or attributes/iconic/materials with { name, ... }. We'll auto-create missing attributes/materials and map names to IDs."
        accept=".csv,.xlsx,.xls,.json"
        allowMultiple
        parseFile={async (f) => parseEquipmentFile(f)}
        onConfirm={async (items, onProgress) => {
          const prevCount = rows.length
          const token = await getToken(); if (!token) throw new Error('Unauthorized')
          // Preload attribute/material dictionaries for name mapping
          const [attrRes, matRes] = await Promise.all([
            fetch(`/api/v1/equipment/attributes`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`/api/v1/equipment/materials`, { headers: { Authorization: `Bearer ${token}` } }),
          ])
          const attrBody = await attrRes.json().catch(() => ([])) as any[]
          const matBody = await matRes.json().catch(() => ([])) as any[]
          const attrByName = new Map<string, string>(
            Array.isArray(attrBody) ? attrBody.map((a: any) => [String(a.name).trim().toLowerCase(), a.id]) : []
          )
          const matByName = new Map<string, string>(
            Array.isArray(matBody) ? matBody.map((m: any) => [String(m.name).trim().toLowerCase(), m.id]) : []
          )

          // Preflight: collect all attribute/material names referenced and create any missing
          const rawItems = (items as any[])
          const normalAttrNames = new Set<string>()
          const iconicAttrNames = new Set<string>()
          const materialNames = new Set<string>()

          function addName(name: any, set: Set<string>) {
            const key = String(name || '').trim()
            if (key) set.add(key)
          }

          for (const raw of rawItems) {
            const aBy = raw?.attributesByName; const iBy = raw?.iconicByName; const mBy = raw?.materialsByName
            if (Array.isArray(aBy)) aBy.forEach((r:any)=> addName(r?.name, normalAttrNames))
            if (Array.isArray(iBy)) iBy.forEach((r:any)=> addName(r?.name, iconicAttrNames))
            if (Array.isArray(mBy)) mBy.forEach((r:any)=> addName(r?.name, materialNames))
            const attrs = raw?.attributes; const iconics = raw?.iconic; const mats = raw?.materials
            if (Array.isArray(attrs)) attrs.forEach((r:any)=> addName((r?.name ?? r?.attributeName ?? r?.stat), normalAttrNames))
            if (Array.isArray(iconics)) iconics.forEach((r:any)=> addName((r?.name ?? r?.attributeName ?? r?.stat), iconicAttrNames))
            if (Array.isArray(mats)) mats.forEach((r:any)=> addName((r?.name ?? r?.materialName ?? r?.material), materialNames))
          }

          // Determine which are missing from current dictionaries
          const toCreateAttr: Array<{ name: string; isIconic: boolean }> = []
          const seenAttr = new Set<string>()
          for (const n of normalAttrNames) {
            const key = n.trim().toLowerCase(); if (!key) continue
            if (!attrByName.has(key) && !seenAttr.has(key)) { toCreateAttr.push({ name: n, isIconic: false }); seenAttr.add(key) }
          }
          for (const n of iconicAttrNames) {
            const key = n.trim().toLowerCase(); if (!key) continue
            if (!attrByName.has(key)) {
              const idx = toCreateAttr.findIndex(x => x.name.trim().toLowerCase() === key)
              if (idx >= 0) toCreateAttr[idx].isIconic = true
              else { toCreateAttr.push({ name: n, isIconic: true }); seenAttr.add(key) }
            }
          }
          const toCreateMat: Array<{ name: string }> = []
          for (const n of materialNames) {
            const key = n.trim().toLowerCase(); if (!key) continue
            if (!matByName.has(key)) toCreateMat.push({ name: n })
          }

          if (toCreateAttr.length) {
            const res = await fetch(`/api/v1/equipment/attributes`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(toCreateAttr)
            })
            // ignore non-200; mapping may still work for existing ones
            await res.json().catch(()=>({}))
          }
          if (toCreateMat.length) {
            const res = await fetch(`/api/v1/equipment/materials`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(toCreateMat)
            })
            await res.json().catch(()=>({}))
          }

          // Refresh dictionaries after potential creations
          {
            const [a2, m2] = await Promise.all([
              fetch(`/api/v1/equipment/attributes`, { headers: { Authorization: `Bearer ${token}` } }),
              fetch(`/api/v1/equipment/materials`, { headers: { Authorization: `Bearer ${token}` } }),
            ])
            const ab = await a2.json().catch(()=>([])) as any[]
            const mb = await m2.json().catch(()=>([])) as any[]
            attrByName.clear(); mb && matByName.clear()
            for (const a of (ab||[])) attrByName.set(String(a.name).trim().toLowerCase(), a.id)
            for (const m of (mb||[])) matByName.set(String(m.name).trim().toLowerCase(), m.id)
          }

          const itemsToSend = (rawItems as any[]).map((raw: any) => {
            const { id: _omit, attributesByName, iconicByName, materialsByName, ...rest } = raw || {}
            const payload: any = { ...rest }

            // Build attributes (normal)
            let mappedAttributes: any[] = []
            if (Array.isArray(attributesByName)) {
              const attrs = attributesByName
                .map((it: any) => {
                  const key = String(it?.name || '').trim().toLowerCase()
                  const attributeId = attrByName.get(key)
                  if (!attributeId) return null
                  return { attributeId, value: it?.value ?? null }
                })
                .filter(Boolean)
              mappedAttributes = attrs as any[]
            }
            // Also support attributes: [{ name, value }] directly or value-only (ignored)
    if (Array.isArray(raw?.attributes)) {
              const attrs = raw.attributes
                .map((it: any) => {
                  if (it?.attributeId) return { attributeId: it.attributeId, value: it?.value ?? null }
      const key = String(it?.name || it?.attributeName || it?.stat || '').trim().toLowerCase()
                  if (!key) return null
                  const attributeId = attrByName.get(key)
                  if (!attributeId) return null
                  return { attributeId, value: it?.value ?? null }
                })
                .filter(Boolean)
              if (attrs.length) mappedAttributes = attrs as any[]
            }
            if (mappedAttributes.length) payload.attributes = mappedAttributes

            if (!payload.iconic && Array.isArray(iconicByName)) {
              const iconics = iconicByName
                .map((it: any) => {
                  const key = String(it?.name || '').trim().toLowerCase()
                  const attributeId = attrByName.get(key)
                  if (!attributeId) return null
                  return { attributeId, value: it?.value ?? null, tier: it?.tier ?? null }
                })
                .filter(Boolean)
              if (iconics.length) payload.iconic = iconics
            }
    if (Array.isArray(raw?.iconic)) {
              const iconics = raw.iconic
                .map((it: any) => {
                  if (it?.attributeId) return { attributeId: it.attributeId, value: it?.value ?? null, tier: it?.tier ?? null }
      const key = String(it?.name || it?.attributeName || it?.stat || '').trim().toLowerCase()
                  if (!key) return null
                  const attributeId = attrByName.get(key)
                  if (!attributeId) return null
                  return { attributeId, value: it?.value ?? null, tier: it?.tier ?? null }
                })
                .filter(Boolean)
              if (iconics.length) payload.iconic = iconics
            }
            if (Array.isArray(materialsByName)) {
              const mats = materialsByName
                .map((it: any) => {
                  const key = String(it?.name || '').trim().toLowerCase()
                  const materialId = matByName.get(key)
                  if (!materialId) return null
                  const rarity = it?.rarity ? formatRarity(it.rarity) : undefined
                  return { materialId, rarity: rarity ?? null, quantity: it?.quantity ?? 1 }
                })
                .filter(Boolean)
              if (mats.length) payload.materials = mats
            }
    if (Array.isArray(raw?.materials)) {
              const mats = raw.materials
                .map((it: any) => {
                  if (it?.materialId) return { materialId: it.materialId, rarity: it?.rarity ? formatRarity(it.rarity) : null, quantity: it?.quantity ?? it?.value ?? 1 }
      const key = String(it?.name || it?.materialName || it?.material || '').trim().toLowerCase()
                  if (!key) return null
                  const materialId = matByName.get(key)
                  if (!materialId) return null
                  const rarity = it?.rarity ? formatRarity(it.rarity) : undefined
                  const quantity = it?.quantity ?? it?.value ?? 1
                  return { materialId, rarity: rarity ?? null, quantity }
                })
                .filter(Boolean)
              if (mats.length) payload.materials = mats
            }
            return payload
          })

          // Chunk uploads to keep requests responsive and allow progress updates
          const chunkSize = 25
          let processed = 0
          for (let i = 0; i < itemsToSend.length; i += chunkSize) {
            const chunk = itemsToSend.slice(i, i + chunkSize)
            const res = await fetch(`/api/v1/equipment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(chunk)
            })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(body?.message || 'Failed to upload equipment')
            processed += chunk.length
            onProgress && onProgress(processed, itemsToSend.length)
          }
          try {
            const listRes = await fetch(`/api/v1/equipment`, { headers: { Authorization: `Bearer ${token}` } })
            const listBody = await listRes.json().catch(() => ([]))
            if (listRes.ok && Array.isArray(listBody)) {
              setRows(listBody as Equipment[])
              const added = Math.max(0, (listBody as Equipment[]).length - prevCount)
              toast(`Processed ${added} new item${added===1?'':'s'}. Refreshed list.`)
            }
          } catch {}
        }}
        confirmLabel="Upload"
      />

      <ViewEquipmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        equipment={selected}
      />
    </>
  )
}

function formatSlot(input: any): Slot | undefined {
  const s = String(input || '').trim().toLowerCase()
  const map: Record<string, Slot> = {
    head: 'HEAD', helmet: 'HEAD', helm: 'HEAD',
    chest: 'CHEST', armor: 'CHEST', armour: 'CHEST',
    gloves: 'HANDS', hands: 'HANDS', arms: 'HANDS',
    boots: 'FEET', feet: 'FEET', legs: 'FEET',
    weapon: 'WEAPON',
    accessory: 'ACCESSORY', trinket: 'ACCESSORY',
  }
  return map[s]
}

function formatRarity(input: any): Rarity | undefined {
  const s = String(input || '').trim().toUpperCase()
  const map: Record<string, Rarity> = {
    COMMON: 'COMMON', NORMAL: 'COMMON',
    UNCOMMON: 'UNCOMMON', ADVANCED: 'UNCOMMON',
    RARE: 'RARE', ELITE: 'RARE',
    EPIC: 'EPIC',
    LEGENDARY: 'LEGENDARY',
  }
  return map[s]
}

async function parseEquipmentFile(f: File): Promise<Equipment[]> {
  const ext = f.name.toLowerCase().split('.').pop() || ''
  if (ext === 'csv') {
    const text = await f.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const headers = (lines.shift() || '').split(',').map((h) => h.trim().toLowerCase())
    const iName = headers.indexOf('name')
    const iSlot = headers.indexOf('slot')
    const iRarity = headers.indexOf('rarity')
    const iSrc = headers.indexOf('src')
    const iAlt = headers.indexOf('alt')
    const out: Equipment[] = []
    for (const line of lines) {
      const cols = line.split(',')
      const slot = formatSlot(cols[iSlot])
      const rarity = formatRarity(cols[iRarity])
      const name = String(cols[iName] || '').trim()
      const src = String(cols[iSrc] || '').trim()
      const alt = String(cols[iAlt] || '').trim()
      if (name && src && slot && rarity) out.push({ id: crypto.randomUUID(), name, src, alt, slot, rarity })
    }
    return out
  } else if (ext === 'xlsx' || ext === 'xls') {
    const XLSXMod = await import('xlsx')
    const XLSX: any = (XLSXMod as any).default || XLSXMod
    const ab = await f.arrayBuffer()
    const wb = XLSX.read(ab, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
    const out: Equipment[] = []
    for (const row of json) {
      const name = String(row.name || row.Name || '').trim()
      const slot = formatSlot(row.slot || row.Slot)
      const rarity = formatRarity(row.rarity || row.Rarity)
      const src = String(row.src || row.Src || row.icon || row.image || '').trim()
      const alt = String(row.alt || row.Alt || '').trim()
      if (name && src && slot && rarity) out.push({ id: crypto.randomUUID(), name, src, alt, slot, rarity })
    }
    return out
  } else if (ext === 'json') {
    try {
      const text = await f.text()
      const arr = JSON.parse(text)
      if (!Array.isArray(arr)) { toast('JSON must be an array of equipment'); return [] }
      const out: any[] = []
      for (const row of arr) {
        const name = String(row.name || '').trim()
        const slot = formatSlot(row.slot)
        const rarity = formatRarity(row.rarity)
        const src = String(row.src || row.image || '').trim()
        const alt = String(row.alt || '').trim()
        if (name && src && slot && rarity) {
          // Preserve nested arrays if provided so we can map them later
          const extras: any = {}
          const keys = ['attributesByName','iconicByName','materialsByName','attributes','iconic','materials']
          for (const k of keys) { if (k in row) extras[k] = row[k] }
          out.push({ id: crypto.randomUUID(), name, src, alt, slot, rarity, ...extras })
        }
      }
      return out
    } catch {
      toast('Invalid JSON file')
      return []
    }
  } else {
    toast('Unsupported file type. Please upload CSV, XLSX/XLS, or JSON')
    return []
  }
}

function AddEditEquipmentDialog({ open, onOpenChange, equipment, onSaved }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  equipment: Equipment | null
  onSaved?: () => void
}) {
  const { getToken } = useAuth()
  const isEdit = !!equipment
  const [name, setName] = useState<string>(equipment?.name || '')
  const [src, setSrc] = useState<string>(equipment?.src || '')
  const [alt, setAlt] = useState<string>(equipment?.alt || '')
  const [slot, setSlot] = useState<Slot | undefined>(equipment?.slot)
  const [rarity, setRarity] = useState<Rarity | undefined>(equipment?.rarity)
  const [saving, setSaving] = useState(false)
  const [attributesOptions, setAttributesOptions] = useState<Attr[]>([])
  const [materialsOptions, setMaterialsOptions] = useState<Mat[]>([])
  const [normalAttributes, setNormalAttributes] = useState<NormalAttrForm[]>([])
  const [iconicAttributes, setIconicAttributes] = useState<IconicAttrForm[]>([])
  const [materials, setMaterials] = useState<MaterialForm[]>([])
  const [addAttrOpen, setAddAttrOpen] = useState(false)
  const [addMatOpen, setAddMatOpen] = useState(false)

  // Compute a preview icon for a material row based on selected material and rarity
  function materialIconForForm(m: MaterialForm): string | undefined {
    const id = m?.materialId
    if (!id) return undefined
    const mat = materialsOptions.find(o => o.id === id)
    const name = (mat?.name || '').toString().trim().toLowerCase().replace(/\s+/g, '_')
    if (!name) return undefined
    // Gold has a single icon without rarity variants
    if (name === 'gold') return '/icons/materials/gold.png'
    // Default to equipment rarity always; UI no longer exposes per-material rarity
    const effectiveRarity = (rarity) as Rarity | undefined
    if (!effectiveRarity) return undefined
    const suffixMap: Record<Rarity, string> = {
      COMMON: 'normal',
      UNCOMMON: 'advanced',
      RARE: 'elite',
      EPIC: 'epic',
      LEGENDARY: 'legendary',
    }
    const suffix = suffixMap[effectiveRarity]
    return `/icons/materials/${name}_${suffix}.png`
  }

  useEffect(() => {
    setName(equipment?.name || '')
    setSrc(equipment?.src || '')
    setAlt(equipment?.alt || '')
    setSlot(equipment?.slot)
    setRarity(equipment?.rarity)
    // Reset nested forms for edit/new
    setNormalAttributes([])
    setIconicAttributes([])
    setMaterials([])
  }, [equipment, open])

  useEffect(() => {
    // When editing, hydrate nested relations from API
    let cancel = false
    ;(async () => {
      if (!open || !equipment?.id) return
      try {
        const token = await getToken(); if (!token) return
        const res = await fetch(`/api/v1/equipment?id=${encodeURIComponent(equipment.id)}&includeAttributes=true&includeIconic=true&includeMaterials=true`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const body = await res.json().catch(() => (null))
        if (!res.ok || !body) return
        if (cancel) return
        // Map API payload into form state
        const nAttrs: NormalAttrForm[] = Array.isArray(body.attributes)
          ? body.attributes.map((ea: any) => ({ attributeId: ea.attributeId ?? ea.attribute?.id, value: ea.value ?? undefined }))
          : []
        const iAttrs: IconicAttrForm[] = Array.isArray(body.iconic)
          ? body.iconic.map((ia: any) => ({ attributeId: ia.attributeId ?? ia.attribute?.id, value: ia.value ?? undefined, tier: ia.tier ?? undefined }))
          : []
        const mats: MaterialForm[] = Array.isArray(body.materials)
          ? body.materials.map((em: any) => ({ materialId: em.materialId ?? em.material?.id, rarity: em.rarity ?? null, quantity: em.quantity ?? 1 }))
          : []
        setNormalAttributes(nAttrs)
        setIconicAttributes(iAttrs)
        setMaterials(mats)
      } catch {}
      return () => { cancel = true }
    })()
  }, [open, equipment?.id, getToken])

  useEffect(() => {
    // Load attribute/material options
    (async () => {
      try {
        const token = await getToken(); if (!token) return
        const [attrRes, matRes] = await Promise.all([
          fetch(`/api/v1/equipment/attributes`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/v1/equipment/materials`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const attrBody = await attrRes.json().catch(() => ([]))
        const matBody = await matRes.json().catch(() => ([]))
        if (attrRes.ok && Array.isArray(attrBody)) setAttributesOptions(attrBody as Attr[])
        if (matRes.ok && Array.isArray(matBody)) setMaterialsOptions(matBody as Mat[])
      } catch {}
    })()
  }, [getToken, open])

  async function onSubmit() {
    try {
      setSaving(true)
      const token = await getToken(); if (!token) throw new Error('Unauthorized')
      if (!name || !src || !slot || !rarity) throw new Error('Please fill all required fields')
      const payload: any = {
        name, src, alt, slot, rarity,
        attributes: normalAttributes.filter(a=>a.attributeId),
        iconic: iconicAttributes.filter(a=>a.attributeId),
        // Do not send per-material rarity from the UI; server will default non-gold to equipment rarity
        materials: materials.filter(m=>m.materialId).map(m => ({ materialId: m.materialId, quantity: m.quantity })),
      }
      if (isEdit) payload.id = equipment!.id
      const res = await fetch(`/api/v1/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to save')
      toast(isEdit ? 'Equipment updated' : 'Equipment created')
      onOpenChange(false)
      onSaved && onSaved()
    } catch (e: any) {
      toast(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Equipment name" />
            </div>
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="/icons/equipment/...png" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Slot</label>
              <Select value={slot} onValueChange={(v) => setSlot(v as Slot)}>
                <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(SLOT_LABELS).map((key) => (
                    <SelectItem key={key} value={key}>{SLOT_LABELS[key as Slot]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Rarity</label>
              <Select value={rarity} onValueChange={(v) => setRarity(v as Rarity)}>
                <SelectTrigger><SelectValue placeholder="Select rarity" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(RARITY_LABELS).map((key) => (
                    <SelectItem key={key} value={key}>{RARITY_LABELS[key as Rarity]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Alt text</label>
            <Input value={alt || ''} onChange={(e) => setAlt(e.target.value)} placeholder="Optional alt text" />
          </div>
          <Separator className="my-2" />
          <div className="space-y-2">
            <div className="font-medium">Attributes</div>
            <div className="space-y-3">
              {normalAttributes.map((a, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select value={a.attributeId} onValueChange={(v)=>{
                    const copy = [...normalAttributes]; copy[idx] = { ...copy[idx], attributeId: v }; setNormalAttributes(copy)
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select attribute" /></SelectTrigger>
                    <SelectContent>
                      {attributesOptions.filter(o=>!o.isIconic).map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={a.value || ''} onChange={(e)=>{
                    const copy = [...normalAttributes]; copy[idx] = { ...copy[idx], value: e.target.value }; setNormalAttributes(copy)
                  }} placeholder="Value (e.g. 4.5%)" />
                  <div className="flex items-center justify-end">
                    <Button variant="ghost" size="sm" onClick={()=>{
                      setNormalAttributes(prev => prev.filter((_,i)=>i!==idx))
                    }}>Remove</Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={()=> setNormalAttributes(prev => [...prev, { attributeId: '' }])}>Add Attribute</Button>
                <Button variant="ghost" size="sm" onClick={()=> setAddAttrOpen(true)}>New Attribute</Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Iconic Attributes</div>
            <div className="space-y-3">
              {iconicAttributes.map((a, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Select value={a.attributeId} onValueChange={(v)=>{
                    const copy = [...iconicAttributes]; copy[idx] = { ...copy[idx], attributeId: v }; setIconicAttributes(copy)
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select iconic attribute" /></SelectTrigger>
                    <SelectContent>
                      {attributesOptions.filter(o=>o.isIconic).map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={a.value || ''} onChange={(e)=>{
                    const copy = [...iconicAttributes]; copy[idx] = { ...copy[idx], value: e.target.value }; setIconicAttributes(copy)
                  }} placeholder="Value (e.g. 2.5%)" />
                  <Input type="number" value={a.tier ?? ''} onChange={(e)=>{
                    const t = e.target.value === '' ? undefined : Number(e.target.value)
                    const copy = [...iconicAttributes]; copy[idx] = { ...copy[idx], tier: t }; setIconicAttributes(copy)
                  }} placeholder="Tier" />
                  <div className="flex items-center justify-end">
                    <Button variant="ghost" size="sm" onClick={()=>{
                      setIconicAttributes(prev => prev.filter((_,i)=>i!==idx))
                    }}>Remove</Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={()=> setIconicAttributes(prev => [...prev, { attributeId: '' }])}>Add Iconic Attribute</Button>
                <Button variant="ghost" size="sm" onClick={()=> setAddAttrOpen(true)}>New Attribute</Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Materials</div>
            <div className="space-y-3">
              {materials.map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={materialIconForForm(m)} alt={materialsOptions.find(o=>o.id===m.materialId)?.name || 'Material'} />
                      <AvatarFallback>MA</AvatarFallback>
                    </Avatar>
                    <Select value={m.materialId} onValueChange={(v)=>{
                      const copy = [...materials]; copy[idx] = { ...copy[idx], materialId: v }; setMaterials(copy)
                    }}>
                      <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                      <SelectContent>
                        {materialsOptions.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input type="number" value={m.quantity ?? 1} onChange={(e)=>{
                    const q = e.target.value === '' ? undefined : Number(e.target.value)
                    const copy = [...materials]; copy[idx] = { ...copy[idx], quantity: q }; setMaterials(copy)
                  }} placeholder="Quantity" />
                  <div className="flex items-center justify-end">
                    <Button variant="ghost" size="sm" onClick={()=>{
                      setMaterials(prev => prev.filter((_,i)=>i!==idx))
                    }}>Remove</Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={()=> setMaterials(prev => [...prev, { materialId: '', quantity: 1 }])}>Add Material</Button>
                <Button variant="ghost" size="sm" onClick={()=> setAddMatOpen(true)}>New Material</Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={onSubmit} disabled={saving}>{saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create')}</Button>
        </DialogFooter>
      </DialogContent>
      <AddAttributeDialog
        open={addAttrOpen}
        onOpenChange={setAddAttrOpen}
        onSaved={(created) => {
          if (created) {
            setAttributesOptions(prev => {
              const exists = prev.some(p => p.id === created.id)
              return exists ? prev : [...prev, { id: created.id, name: created.name, isIconic: created.isIconic }]
            })
          }
        }}
      />
      <AddMaterialDialog
        open={addMatOpen}
        onOpenChange={setAddMatOpen}
        onSaved={(created) => {
          if (created) {
            setMaterialsOptions(prev => {
              const exists = prev.some(p => p.id === created.id)
              return exists ? prev : [...prev, { id: created.id, name: created.name }]
            })
          }
        }}
      />
    </Dialog>
  )
}

function ViewEquipmentDialog({ open, onOpenChange, equipment }: { open: boolean, onOpenChange: (v: boolean) => void, equipment: Equipment | null }) {
  const { getToken } = useAuth()
  const [details, setDetails] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancel = false
    ;(async () => {
      if (!open || !equipment?.id) { setDetails(null); return }
      try {
        setLoading(true)
        const token = await getToken(); if (!token) return
        const res = await fetch(`/api/v1/equipment?id=${encodeURIComponent(equipment.id)}&includeAttributes=true&includeIconic=true&includeMaterials=true`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const body = await res.json().catch(() => null)
        if (!cancel) setDetails(res.ok ? body : null)
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => { cancel = true }
  }, [open, equipment?.id, getToken])

  const eq = details || equipment

  function materialIconFor(em: any): string | undefined {
    const base = em?.material?.src as string | undefined
    const rarity = em?.rarity as Rarity | null | undefined
    if (!base) return undefined
    if (!rarity) return base
    // If base is already a materials icon path without rarity, swap in the rarity variant.
    // Expecting materials like /icons/materials/leather_normal.png, etc.
    const name = (em?.material?.name || '').toString().trim().toLowerCase().replace(/\s+/g, '_')
    if (!name) return base
    const suffixMap: Record<Rarity, string> = {
      COMMON: 'normal',
      UNCOMMON: 'advanced',
      RARE: 'elite',
      EPIC: 'epic',
      LEGENDARY: 'legendary',
    }
    const suffix = suffixMap[rarity]
    return `/icons/materials/${name}_${suffix}.png`
  }

  function toRoman(n?: number | null): string | null {
    if (n == null || isNaN(n)) return null
    const num = Math.max(1, Math.floor(n))
    const romans: Array<[number, string]> = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ]
    let rem = num
    let out = ''
    for (const [val, sym] of romans) {
      while (rem >= val) { out += sym; rem -= val }
      if (rem === 0) break
    }
    return out
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Equipment Details</DialogTitle>
        </DialogHeader>
        {eq ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={eq.src} alt={eq.name} />
                <AvatarFallback>{eq.name.slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="font-semibold text-lg">{eq.name}</div>
                <div className="text-sm text-muted-foreground">{eq.alt}</div>
                <div className="text-sm">Slot: <span className="text-muted-foreground">{SLOT_LABELS[eq.slot as Slot]}</span></div>
                <div className="text-sm">Rarity: <span className="text-muted-foreground">{RARITY_LABELS[eq.rarity as Rarity]}</span></div>
              </div>
            </div>
            <Separator />
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading details…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-2">Attributes</div>
                  <div className="space-y-2">
                    {Array.isArray(eq.attributes) && eq.attributes.length > 0 ? (
                      eq.attributes.map((it: any, idx: number) => (
                        <div key={`attr-${idx}`} className="text-sm flex justify-between">
                          <span className="text-muted-foreground">{it?.attribute?.name ?? it?.attributeId}</span>
                          <span>{it?.value ?? '-'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No attributes</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Iconic</div>
                  <div className="space-y-2">
                    {Array.isArray(eq.iconic) && eq.iconic.length > 0 ? (
                      eq.iconic.map((it: any, idx: number) => {
                        const r = toRoman(typeof it?.tier === 'number' ? it.tier : null)
                        const name = it?.attribute?.name ?? it?.attributeId
                        const val = it?.value ?? '-'
                        return (
                          <div key={`iconic-${idx}`} className="text-sm">
                            {r ? <span className="text-muted-foreground font-semibold mr-2">{r}</span> : null}
                            <span className="text-muted-foreground mr-2">{name}</span>
                            <span>{val > 0 ? `${val}` : ''}</span>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-xs text-muted-foreground">No iconic bonuses</div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-sm font-medium mb-2">Materials</div>
                  <div className="space-y-2">
                    {Array.isArray(eq.materials) && eq.materials.length > 0 ? (
                      eq.materials.map((it: any, idx: number) => (
        <div key={`mat-${idx}`} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
          <AvatarImage src={materialIconFor(it) || it?.material?.src} alt={it?.material?.name} />
                              <AvatarFallback>{(it?.material?.name || '?').slice(0,2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">{it?.material?.name ?? it?.materialId}</span>
                            {it?.rarity ? <span className="text-xs text-muted-foreground">• {RARITY_LABELS[it.rarity as Rarity]}</span> : null}
                          </div>
                          <span>x{it?.quantity ?? 1}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No materials</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

