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
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { HeaderActions } from "../../(components)/layout/HeaderActions"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { FileUploadDialog } from "@/app/components/FileUploadDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddMaterialDialog } from "@/components/admin/equipment/AddMaterialDialog"

type Mat = {
  id: string
  name: string
  src?: string | null
  description?: string | null
}

export default function EquipmentMaterialsPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<Mat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [toDelete, setToDelete] = useState<Mat | null>(null)

  useEffect(() => {
    let cancel = false
    async function load() {
      try {
        const token = await getToken(); if (!token) throw new Error('Unauthorized')
        const res = await fetch(`/api/v1/equipment/materials`, { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(() => ([]))
        if (!res.ok) throw new Error(body?.message || 'Failed to load materials')
        if (!cancel) setRows(body as Mat[])
      } catch (e:any) {
        if (!cancel) setError(e.message || 'Error')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load();
    return () => { cancel = true }
  }, [getToken])

  const columns = useMemo<ColumnDef<Mat>[]>(() => [
    {
      accessorKey: 'name', header: 'Name',
      cell: ({ row }) => {
        const { name, src } = row.original
        const initials = (name || '?').slice(0,2).toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={src || ''} alt={name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              <span className="text-xs text-muted-foreground">{row.original.description || ''}</span>
            </div>
          </div>
        )
      }
    },
    { id: 'actions', header: 'Actions', enableSorting: false, cell: ({ row }) => (
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="icon" title="Delete" onClick={()=>{ setToDelete(row.original); setConfirmOpen(true) }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ) },
  ], [])

  return (
    <>
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)}>Add Material</Button>
          <Button variant="secondary" onClick={() => setUploadOpen(true)}>Upload Materials</Button>
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
              <DataTable<Mat>
                data={rows}
                columns={columns}
                loading={loading}
                error={error}
                pageSize={10}
                searchable
                searchKeys={["name", "description"]}
                searchPlaceholder="Search materials"
                initialSorting={[{ id: "name", desc: false }]}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <AddMaterialDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={async () => {
          const token = await getToken(); if (!token) return
          const listRes = await fetch(`/api/v1/equipment/materials`, { headers: { Authorization: `Bearer ${token}` } })
          const listBody = await listRes.json().catch(() => ([]))
          if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Mat[])
        }}
      />

      <FileUploadDialog<Mat>
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload Materials"
        description="CSV, XLSX/XLS, or JSON (array). Shape: { name, src?, description? }"
        accept=".csv,.xlsx,.xls,.json"
        allowMultiple
        parseFile={parseMatFile}
        onConfirm={async (items, onProgress) => {
          const token = await getToken(); if (!token) throw new Error('Unauthorized')
          const chunkSize = 50
          for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize)
            const res = await fetch(`/api/v1/equipment/materials`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(chunk)
            })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(body?.message || 'Failed to upload materials')
            onProgress && onProgress(Math.min(i + chunk.length, items.length), items.length)
          }
          try {
            const listRes = await fetch(`/api/v1/equipment/materials`, { headers: { Authorization: `Bearer ${token}` } })
            const listBody = await listRes.json().catch(() => ([]))
            if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Mat[])
          } catch {}
        }}
        confirmLabel="Upload"
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete material?"
        description={toDelete ? `Delete material "${toDelete.name}"? This cannot be undone.` : undefined}
        confirmText="Delete"
        confirmVariant="destructive"
        loading={confirmBusy}
        onConfirm={async ()=>{
          if (!toDelete) return
          setConfirmBusy(true)
          try {
            const token = await getToken(); if (!token) throw new Error('Unauthorized')
            const res = await fetch(`/api/v1/equipment/materials?id=${encodeURIComponent(toDelete.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(body?.message || 'Failed to delete')
            const listRes = await fetch(`/api/v1/equipment/materials`, { headers: { Authorization: `Bearer ${token}` } })
            const listBody = await listRes.json().catch(() => ([]))
            if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Mat[])
            toast('Deleted')
            setConfirmOpen(false)
          } catch (e:any) { toast(e.message || 'Delete failed') }
          finally { setConfirmBusy(false); setToDelete(null) }
        }}
      />
    </>
  )
}

// Reused AddMaterialDialog component

async function parseMatFile(f: File): Promise<Mat[]> {
  const ext = f.name.toLowerCase().split('.').pop() || ''
  if (ext === 'csv') {
    const text = await f.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const headers = (lines.shift() || '').split(',').map((h) => h.trim().toLowerCase())
    const iName = headers.indexOf('name')
    const iSrc = headers.indexOf('src')
    const iDesc = headers.indexOf('description')
    const out: Mat[] = []
    for (const line of lines) {
      const cols = line.split(',')
      const name = String(cols[iName] || '').trim()
      if (!name) continue
      const src = String(cols[iSrc] || '').trim()
      const description = String(cols[iDesc] || '').trim()
      out.push({ id: crypto.randomUUID(), name, src, description })
    }
    return out
  } else if (ext === 'xlsx' || ext === 'xls') {
    const XLSXMod = await import('xlsx')
    const XLSX: any = (XLSXMod as any).default || XLSXMod
    const ab = await f.arrayBuffer()
    const wb = XLSX.read(ab, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
    return json.map((row:any) => ({
      id: crypto.randomUUID(),
      name: String(row.name || row.Name || '').trim(),
      src: String(row.src || row.Src || '').trim(),
      description: String(row.description || row.Description || '').trim(),
    })).filter((r:Mat) => r.name)
  } else if (ext === 'json') {
    try {
      const text = await f.text()
      const arr = JSON.parse(text)
      if (!Array.isArray(arr)) { toast('JSON must be an array of materials'); return [] }
      return arr.map((row:any) => ({
        id: crypto.randomUUID(),
        name: String(row.name || '').trim(),
        src: String(row.src || '').trim(),
        description: String(row.description || '').trim(),
      })).filter((r:Mat) => r.name)
    } catch {
      toast('Invalid JSON file');
      return []
    }
  } else {
    toast('Unsupported file type. Please upload CSV, XLSX/XLS, or JSON')
    return []
  }
}
