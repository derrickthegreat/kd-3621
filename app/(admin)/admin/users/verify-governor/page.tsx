"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type LinkRequest = {
  id: string
  status: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELED'
  note?: string | null
  decisionNote?: string | null
  createdAt: string
  user: { id: string, clerkId: string }
  player: { id: string, rokId: string, name: string, alliance?: { tag?: string|null } | null }
  proofs?: Array<{ id: string; url: string; uploadedAt: string }>
}

export default function VerifyGovernorPage(){
  const { getToken } = useAuth()
  const [rows, setRows] = useState<LinkRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [selected, setSelected] = useState<LinkRequest|null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'APPROVE'|'REJECT'|'LINK'|'CANCEL'|null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [uploadBusyId, setUploadBusyId] = useState<string|null>(null)

  async function load(){
    try{ setLoading(true)
      const token = await getToken(); if (!token) throw new Error('Unauthorized')
      const res = await fetch(`/api/v1/link-requests`, { headers: { Authorization: `Bearer ${token}` } })
      const body = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(body?.message || 'Failed to load')
      setRows(body?.requests ?? [])
    }catch(e:any){ setError(e.message || 'Error') } finally{ setLoading(false) }
  }

  useEffect(()=>{ load() },[])

  const columns = useMemo<ColumnDef<LinkRequest>[]>(() => [
    { accessorKey:'createdAt', header:'Requested', cell:({row})=> new Date(row.original.createdAt).toLocaleString() },
    { accessorKey:'user', header:'User', cell:({row})=> <span className="text-sm">{row.original.user.clerkId}</span> },
    { accessorKey:'player', header:'Governor', cell:({row})=> {
      const p = row.original.player
      return <span className="text-sm font-medium">{p.name}</span>
    } },
    { accessorKey:'rokId', header:'RoK ID', cell:({row})=> <span className="text-sm">{row.original.player.rokId}</span> },
    { accessorKey:'alliance', header:'Alliance', cell:({row})=> <span className="text-xs text-muted-foreground">{row.original.player.alliance?.tag || ''}</span> },
    { accessorKey:'status', header:'Status' },
    { accessorKey:'proofs', header:'Proofs', cell:({row})=>{
      const ps = row.original.proofs || []
      if (!ps.length) return <span className="text-xs text-muted-foreground">None</span>
      return (
        <div className="flex items-center gap-1 max-w-[220px] overflow-hidden">
          {ps.slice(0,4).map((p)=> (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="proof" className="h-8 w-8 rounded object-cover border" />
            </a>
          ))}
          {ps.length > 4 ? (
            <span className="text-xs text-muted-foreground pl-1">+{ps.length - 4}</span>
          ) : null}
        </div>
      )
    } },
    { id:'actions', header:'Actions', cell:({row})=>{
      const r = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { setSelected(r); setConfirmAction('APPROVE'); setConfirmOpen(true) }} disabled={r.status!=='PENDING'}>Approve</Button>
          <Button variant="outline" size="sm" onClick={() => { setSelected(r); setConfirmAction('REJECT'); setConfirmOpen(true) }} disabled={r.status!=='PENDING'}>Reject</Button>
          <div className="flex items-center gap-2">
            <Input placeholder="Proof URL" className="h-8 w-52" value={selected?.id===r.id? proofUrl: ''} onChange={(e)=>{ setSelected(r); setProofUrl(e.target.value) }} />
            <Button size="sm" onClick={async()=>{
              try{ const token = await getToken(); if(!token) throw new Error('Unauthorized')
                const url = proofUrl.trim(); if(!url){ toast.error('Enter a proof URL'); return }
                const res = await fetch(`/api/v1/link-requests/${encodeURIComponent(r.id)}/proofs`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ url }) })
                const b = await res.json().catch(()=>({}))
                if(!res.ok) throw new Error(b?.message || 'Failed to add proof')
                toast.success('Proof added')
                setProofUrl('')
                await load()
              }catch(e:any){ toast.error(e.message || 'Failed') }
            }}>Add Proof</Button>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              id={`upload-${r.id}`}
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0]
                if (!file) return
                setUploadBusyId(r.id)
                try {
                  const form = new FormData()
                  form.set('file', file)
                  const up = await fetch('/api/v1/uploads/proofs', { method: 'POST', body: form })
                  const ub = await up.json().catch(()=>({}))
                  if (!up.ok) throw new Error(ub?.message || 'Upload failed')
                  const token = await getToken(); if (!token) throw new Error('Unauthorized')
                  const res = await fetch(`/api/v1/link-requests/${encodeURIComponent(r.id)}/proofs`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ url: ub.url }) })
                  const b = await res.json().catch(()=>({}))
                  if(!res.ok) throw new Error(b?.message || 'Failed to add proof')
                  toast.success('Proof uploaded')
                  setProofUrl('')
                  await load()
                } catch (err:any) {
                  toast.error(err.message || 'Upload failed')
                } finally {
                  setUploadBusyId(null)
                  e.currentTarget.value = ''
                }
              }}
            />
            <label htmlFor={`upload-${r.id}`}>
              <Button size="sm" variant="outline" disabled={!!uploadBusyId && uploadBusyId!==r.id}>
                {uploadBusyId===r.id ? 'Uploading…' : 'Upload Image'}
              </Button>
            </label>
          </div>
          <Button variant="secondary" size="sm" onClick={() => { setSelected(r); setConfirmAction('LINK'); setConfirmOpen(true) }} disabled={r.status!=='APPROVED'}>Link</Button>
        </div>
      )
    } },
  ],[])

  return (
    <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
      {loading ? <Skeleton className="h-64 w-full"/> : error ? (<p className="text-red-500">{error}</p>) : (
        <Card>
          <CardContent className="p-0">
            <DataTable<LinkRequest>
              data={rows}
              columns={columns}
              pageSize={10}
              searchable
              searchKeys={["player.name","player.rokId","user.clerkId"]}
              searchPlaceholder="Search requests by user or governor"
              initialSorting={[{ id:'createdAt', desc:true }]}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmAction==='APPROVE'? 'Approve request?': confirmAction==='REJECT' ? 'Reject request?' : 'Link user and governor?'}
        description={confirmAction==='LINK' ? 'This will create a link between the user and the governor record.' : undefined}
        confirmText={confirmAction==='APPROVE' ? 'Approve' : confirmAction==='REJECT' ? 'Reject' : 'Link'}
        confirmVariant={confirmAction==='REJECT' ? 'destructive' : 'default'}
        loading={confirmBusy}
        onConfirm={async ()=>{
          if (!selected || !confirmAction) return
          setConfirmBusy(true)
          try{
            const token = await getToken(); if(!token) throw new Error('Unauthorized')
            const res = await fetch(`/api/v1/link-requests`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ id: selected.id, action: confirmAction }) })
            const b = await res.json().catch(()=>({}))
            if(!res.ok) throw new Error(b?.message || 'Failed')
            toast.success('Updated')
            setConfirmOpen(false)
            await load()
          }catch(e:any){ toast.error(e.message || 'Failed') }
          finally{ setConfirmBusy(false); setConfirmAction(null); setSelected(null) }
        }}
      />
    </div>
  )
}
