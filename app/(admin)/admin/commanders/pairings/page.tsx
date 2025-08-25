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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { NameCell } from "@/components/admin/commanders/name-cell"
import { CommanderSelect, type CommanderOption } from "@/components/admin/commanders/commander-select"
import { CommanderCombobox } from "@/components/admin/commanders/commander-combobox"
import { FileUploadDialog } from "@/app/components/FileUploadDialog"
import { ViewEditCommanderDialog, type CommanderLike } from "@/components/admin/commanders/view-edit-commander-dialog"

type Commander = { id: string; name: string; iconUrl: string }
type Pairing = {
  id: string
  primary: Commander
  secondary: Commander
}
type TableRow = Pairing & { primaryName: string; secondaryName: string }
type PairingUpload = { primaryid?: string; secondaryid?: string; primary?: string; secondary?: string }

export default function PairingsPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<Pairing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [cmdDialogOpen, setCmdDialogOpen] = useState(false)
  const [cmdDialogMode, setCmdDialogMode] = useState<'view'|'edit'>('view')
  const [cmdSelected, setCmdSelected] = useState<CommanderLike | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toDelete, setToDelete] = useState<TableRow | null>(null)

  async function refresh() {
    try {
      const token = await getToken()
      if (!token) throw new Error('Unauthorized')
      const res = await fetch(`/api/v1/commander/pairing`, { headers: { Authorization: `Bearer ${token}` } })
      const body = await res.json().catch(() => ([]))
      if (!res.ok) throw new Error(body?.message || 'Failed to load pairings')
      setRows(body as Pairing[])
    } catch (e: any) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const columns = useMemo<ColumnDef<TableRow>[]>(() => [
    {
      accessorKey: 'primaryName',
      header: 'Primary',
  cell: ({ row }) => (
        <NameCell
          name={row.original.primary.name}
          iconUrl={row.original.primary.iconUrl}
          onClick={() => {
            setCmdSelected({
              id: row.original.primary.id,
              name: row.original.primary.name,
              iconUrl: row.original.primary.iconUrl,
              speciality: [],
            })
            setCmdDialogMode('view')
            setCmdDialogOpen(true)
          }}
        />
      ),
    },
    {
      accessorKey: 'secondaryName',
      header: 'Secondary',
  cell: ({ row }) => (
        <NameCell
          name={row.original.secondary.name}
          iconUrl={row.original.secondary.iconUrl}
          onClick={() => {
            setCmdSelected({
              id: row.original.secondary.id,
              name: row.original.secondary.name,
              iconUrl: row.original.secondary.iconUrl,
              speciality: [],
            })
            setCmdDialogMode('view')
            setCmdDialogOpen(true)
          }}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {/* Archive primary commander */}
          <IconButton label="Archive" onClick={async () => {
            try {
              const token = await getToken(); if (!token) throw new Error('Unauthorized')
              await fetch(`/api/v1/commander?id=${encodeURIComponent(row.original.primary.id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isArchived: true })
              }).then(async (r) => { if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b?.message || 'Archive failed') }})
              toast('Commander archived')
              refresh()
            } catch (e: any) { toast(e.message || 'Archive failed') }
          }} icon="archive" />
          {/* Delete pairing */}
          <IconButton label="Delete pairing" onClick={() => { setToDelete(row.original); setConfirmOpen(true) }} icon="trash" />
        </div>
      ),
    },
  ], [])

  return (
    <>
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)}>Add Pairing</Button>
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
                data={rows.map(r => ({...r, primaryName: r.primary.name, secondaryName: r.secondary.name}))}
                columns={columns}
                loading={loading}
                error={error}
                pageSize={10}
                initialSorting={[{ id: 'primaryName', desc: false }]}
                searchable
                searchKeys={["primaryName","secondaryName"]}
                searchPlaceholder="Search primary or secondary"
              />
            </CardContent>
          </Card>
        )}
      </div>

      <AddPairingDialog open={addOpen} onOpenChange={(v) => setAddOpen(v)} onSaved={refresh} />
      <FileUploadDialog<PairingUpload>
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload Pairings"
        description="CSV, XLSX/XLS, or JSON. Columns accepted: primaryid,secondaryid OR primary,secondary (names)."
        accept=".csv,.xlsx,.xls,.json"
        parseFile={async (f) => parsePairingsFile(f)}
        onConfirm={async (items, onProgress) => {
          // map names to ids if needed, then POST each pairing
          const token = await getToken()
          if (!token) throw new Error('Unauthorized')
          const commanderList = await fetch(`/api/v1/commander`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => [])
          const byName = new Map<string, string>(Array.isArray(commanderList) ? commanderList.map((c: any) => [String(c.name).toLowerCase(), c.id]) : [])
          const chunkSize = 50
          let processed = 0
          const results: Array<{ ok: boolean; message?: string }> = []
          for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize)
            const uploads = chunk.map(async (it) => {
              let primaryid = it.primaryid
              let secondaryid = it.secondaryid
              if (!primaryid && it.primary) primaryid = byName.get(String(it.primary).toLowerCase())
              if (!secondaryid && it.secondary) secondaryid = byName.get(String(it.secondary).toLowerCase())
              if (!primaryid || !secondaryid || primaryid === secondaryid) return { ok: false, message: 'Invalid row' }
              const res = await fetch(`/api/v1/commander/pairing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ primaryid, secondaryid })
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
          else toast('Pairings uploaded')
          await refresh()
        }}
        confirmLabel="Import"
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete pairing?"
        description={toDelete ? `This will remove the pairing between ${toDelete.primary?.name} and ${toDelete.secondary?.name}.` : undefined}
        confirmText="Delete"
        confirmVariant="destructive"
        onConfirm={async ()=>{
          if (!toDelete) return
          try{
            const token = await getToken(); if (!token) throw new Error('Unauthorized')
            const res = await fetch(`/api/v1/commander/pairing?id=${encodeURIComponent(toDelete.id)}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } })
            const body = await res.json().catch(()=>({}))
            if (!res.ok) throw new Error(body?.message || 'Failed to delete pairing')
            toast('Pairing deleted')
            setConfirmOpen(false)
            setToDelete(null)
            await refresh()
          }catch(e:any){ toast(e.message || 'Delete failed') }
        }}
      />
      <ViewEditCommanderDialog
        open={cmdDialogOpen}
        mode={cmdDialogMode}
        commander={cmdSelected}
        onOpenChange={setCmdDialogOpen}
        onSaved={refresh}
      />
    </>
  )
}

function AddPairingDialog({ open, onOpenChange, onSaved }: { open: boolean, onOpenChange: (v: boolean) => void, onSaved: () => void }) {
  const { getToken } = useAuth()
  const [busy, setBusy] = useState(false)
  const [options, setOptions] = useState<CommanderOption[]>([])
  const [primaryId, setPrimaryId] = useState<string | undefined>()
  const [secondaryId, setSecondaryId] = useState<string | undefined>()

  useEffect(() => {
    let cancel = false
    ;(async () => {
      try {
        const token = await getToken()
        if (!token) return
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
      if (!primaryId || !secondaryId) throw new Error('Select both commanders')
      if (primaryId === secondaryId) throw new Error('Pick two different commanders')
      const hasPrimary = options.some((o) => o.id === primaryId)
      const hasSecondary = options.some((o) => o.id === secondaryId)
      if (!hasPrimary || !hasSecondary) throw new Error('Commander not found')
      const token = await getToken()
      if (!token) throw new Error('Unauthorized')
      const res = await fetch(`/api/v1/commander/pairing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ primaryid: primaryId, secondaryid: secondaryId })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to create pairing')
      toast('Pairing added')
      onOpenChange(false)
      setPrimaryId(undefined)
      setSecondaryId(undefined)
      onSaved()
    } catch (e: any) {
      toast(e.message || 'Error creating pairing')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Pairing</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Primary Commander</label>
            <CommanderCombobox value={primaryId} onChange={setPrimaryId} options={options} placeholder="Select primary" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Secondary Commander</label>
            <CommanderCombobox value={secondaryId} onChange={setSecondaryId} options={options} placeholder="Select secondary" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || !primaryId || !secondaryId}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function IconButton({ label, onClick, icon }: { label: string, onClick: () => void, icon: 'eye' | 'pencil' | 'archive' | 'trash' }) {
  const Icon = icon === 'eye' ? require('lucide-react').Eye : icon === 'pencil' ? require('lucide-react').Pencil : icon === 'archive' ? require('lucide-react').Archive : require('lucide-react').Trash
  return (
    <Button variant="ghost" size="sm" aria-label={label} title={label} onClick={onClick}>
      <Icon className="h-4 w-4" />
    </Button>
  )
}

// Deleted custom DeleteConfirmDialog in favor of shared ConfirmDialog

async function parsePairingsFile(file: File): Promise<PairingUpload[]> {
  const name = file.name.toLowerCase()
  const ext = name.split('.').pop() || ''
  if (ext === 'csv') {
    const text = await file.text()
    const rows = text.split(/\r?\n/).filter(Boolean)
    if (!rows.length) return []
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase())
    const idx = {
      primaryid: headers.indexOf('primaryid'),
      secondaryid: headers.indexOf('secondaryid'),
      primary: headers.indexOf('primary'),
      secondary: headers.indexOf('secondary'),
    }
    return rows.slice(1).map((line) => {
      const cols = line.split(',')
      return {
        primaryid: idx.primaryid >= 0 ? cols[idx.primaryid]?.trim() : undefined,
        secondaryid: idx.secondaryid >= 0 ? cols[idx.secondaryid]?.trim() : undefined,
        primary: idx.primary >= 0 ? cols[idx.primary]?.trim() : undefined,
        secondary: idx.secondary >= 0 ? cols[idx.secondary]?.trim() : undefined,
      }
    }).filter(r => r.primaryid || r.secondaryid || r.primary || r.secondary)
  } else if (ext === 'xlsx' || ext === 'xls') {
    const ab = await file.arrayBuffer()
    const XLSXMod = await import('xlsx')
    const XLSX: any = (XLSXMod as any).default || XLSXMod
    const wb = XLSX.read(ab, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
    return json.map((row) => ({
      primaryid: String(row.primaryid || row.PrimaryId || row.PrimaryID || row.PRIMARYID || '').trim() || undefined,
      secondaryid: String(row.secondaryid || row.SecondaryId || row.SecondaryID || row.SECONDARYID || '').trim() || undefined,
      primary: String(row.primary || row.Primary || '').trim() || undefined,
      secondary: String(row.secondary || row.Secondary || '').trim() || undefined,
    })).filter(r => r.primaryid || r.secondaryid || r.primary || r.secondary)
  } else if (ext === 'json') {
    const text = await file.text()
    try {
      const arr = JSON.parse(text)
      if (!Array.isArray(arr)) return []
      return arr.map((r: any) => ({
        primaryid: String(r.primaryid || '').trim() || undefined,
        secondaryid: String(r.secondaryid || '').trim() || undefined,
        primary: String(r.primary || '').trim() || undefined,
        secondary: String(r.secondary || '').trim() || undefined,
      })).filter(r => r.primaryid || r.secondaryid || r.primary || r.secondary)
    } catch {
      return []
    }
  }
  toast('Unsupported file type. Please upload CSV, XLSX/XLS, or JSON')
  return []
}
