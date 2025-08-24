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
import { FileUploadDialog } from "@/app/components/FileUploadDialog"
import { AddAttributeDialog } from "@/components/admin/equipment/AddAttributeDialog"

type Attr = {
  id: string
  name: string
  description?: string | null
  isIconic?: boolean
}

export default function EquipmentAttributesPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<Attr[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [toDelete, setToDelete] = useState<Attr | null>(null)

  useEffect(() => {
    let cancel = false
    async function load() {
      try {
        const token = await getToken(); if (!token) throw new Error('Unauthorized')
        const res = await fetch(`/api/v1/equipment/attributes`, { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(() => ([]))
        if (!res.ok) throw new Error(body?.message || 'Failed to load attributes')
        if (!cancel) setRows(body as Attr[])
      } catch (e:any) {
        if (!cancel) setError(e.message || 'Error')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load();
    return () => { cancel = true }
  }, [getToken])

  const columns = useMemo<ColumnDef<Attr>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.description || ''}</span>
    ) },
    { id: 'isIconic', header: 'Iconic', accessorFn: (r) => r.isIconic ? 'Yes' : 'No' },
    { id: 'actions', header: 'Actions', enableSorting: false, cell: ({ row }) => (
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="icon" title="Delete" onClick={()=>{ setToDelete(row.original); setConfirmOpen(true) }}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ) },
  ], [getToken])

  return (
    <>
      <Toaster />
      <HeaderActions>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddOpen(true)}>Add Attribute</Button>
          <Button variant="secondary" onClick={() => setUploadOpen(true)}>Upload Attributes</Button>
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
              <DataTable<Attr>
                data={rows}
                columns={columns}
                loading={loading}
                error={error}
                pageSize={10}
                searchable
                searchKeys={["name", "description"]}
                searchPlaceholder="Search attributes"
                initialSorting={[{ id: "name", desc: false }]}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <AddAttributeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={async () => {
          const token = await getToken(); if (!token) return
          const listRes = await fetch(`/api/v1/equipment/attributes`, { headers: { Authorization: `Bearer ${token}` } })
          const listBody = await listRes.json().catch(() => ([]))
          if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Attr[])
        }}
      />

      <FileUploadDialog<Attr>
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload Attributes"
        description="CSV, XLSX/XLS, or JSON (array). Shape: { name, description?, isIconic? }"
        accept=".csv,.xlsx,.xls,.json"
        allowMultiple
        parseFile={parseAttrFile}
        onConfirm={async (items, onProgress) => {
          const token = await getToken(); if (!token) throw new Error('Unauthorized')
          const chunkSize = 50
          for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize)
            const res = await fetch(`/api/v1/equipment/attributes`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(chunk)
            })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(body?.message || 'Failed to upload attributes')
            onProgress && onProgress(Math.min(i + chunk.length, items.length), items.length)
          }
          try {
            const listRes = await fetch(`/api/v1/equipment/attributes`, { headers: { Authorization: `Bearer ${token}` } })
            const listBody = await listRes.json().catch(() => ([]))
            if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Attr[])
          } catch {}
        }}
        confirmLabel="Upload"
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete attribute?"
        description={toDelete ? `Delete attribute "${toDelete.name}"? This cannot be undone.` : undefined}
        confirmText="Delete"
        confirmVariant="destructive"
        loading={confirmBusy}
        onConfirm={async ()=>{
          if (!toDelete) return
          setConfirmBusy(true)
          try {
            const token = await getToken(); if (!token) throw new Error('Unauthorized')
            const res = await fetch(`/api/v1/equipment/attributes?id=${encodeURIComponent(toDelete.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(body?.message || 'Failed to delete')
            const listRes = await fetch(`/api/v1/equipment/attributes`, { headers: { Authorization: `Bearer ${token}` } })
            const listBody = await listRes.json().catch(() => ([]))
            if (listRes.ok && Array.isArray(listBody)) setRows(listBody as Attr[])
            toast('Deleted')
            setConfirmOpen(false)
          } catch (e:any) { toast(e.message || 'Delete failed') }
          finally { setConfirmBusy(false); setToDelete(null) }
        }}
      />
    </>
  )
}

// Reused AddAttributeDialog component

async function parseAttrFile(f: File): Promise<Attr[]> {
  const ext = f.name.toLowerCase().split('.').pop() || ''
  if (ext === 'csv') {
    const text = await f.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    const headers = (lines.shift() || '').split(',').map((h) => h.trim().toLowerCase())
    const iName = headers.indexOf('name')
    const iDesc = headers.indexOf('description')
    const iIcon = headers.indexOf('isiconic')
    const out: Attr[] = []
    for (const line of lines) {
      const cols = line.split(',')
      const name = String(cols[iName] || '').trim()
      if (!name) continue
      const description = String(cols[iDesc] || '').trim()
      const isIconic = String(cols[iIcon] || '').trim().toLowerCase() === 'true'
      out.push({ id: crypto.randomUUID(), name, description, isIconic })
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
      description: String(row.description || row.Description || '').trim(),
      isIconic: String(row.isIconic || row.Iconic || row.isiconic || '').trim().toLowerCase() === 'true'
    })).filter((r:Attr) => r.name)
  } else if (ext === 'json') {
    try {
      const text = await f.text()
      const arr = JSON.parse(text)
      if (!Array.isArray(arr)) { toast('JSON must be an array of attributes'); return [] }
      return arr.map((row:any) => ({
        id: crypto.randomUUID(),
        name: String(row.name || '').trim(),
        description: String(row.description || '').trim(),
        isIconic: !!row.isIconic,
      })).filter((r:Attr) => r.name)
    } catch {
      toast('Invalid JSON file');
      return []
    }
  } else {
    toast('Unsupported file type. Please upload CSV, XLSX/XLS, or JSON')
    return []
  }
}
