"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Link2, MoreVertical, Pencil, RefreshCw, ShieldCheck, UserCheck, UserX } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Role = "ADMIN" | "KINGDOM_MEMBER" | "SYSTEM"

type UserRow = {
  id: string
  clerkId: string
  role: Role
  createdAt: string
  updatedAt: string
  governorsCount: number
  profile: {
    id: string
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    email?: string | null
  imageUrl?: string | null
  // app profile additions
  displayName?: string | null
  username?: string | null
  appAvatarUrl?: string | null
  commanderAvatarId?: string | null
  socials?: any
  effectiveAvatarUrl?: string | null
  publicMetadata?: any
  } | null
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  KINGDOM_MEMBER: "Member",
  SYSTEM: "System",
}

export default function UsersPage() {
  const { getToken } = useAuth()
  const [rows, setRows] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUserId, setLinkUserId] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState("")
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [confirmInfo, setConfirmInfo] = useState<{ user: UserRow, action: 'deactivate' | 'reactivate' } | null>(null)

  useEffect(() => {
    let cancel = false
    async function load() {
      try {
        const token = await getToken()
        if (!token) throw new Error("Unauthorized")
        const res = await fetch(`/api/v1/users`, { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body?.message || "Failed to load users")
        const data = (body?.users ?? []) as UserRow[]
        if (!cancel) setRows(data)
      } catch (e: any) {
        if (!cancel) setError(e.message || "Error")
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [getToken])

  const columns = useMemo<ColumnDef<UserRow>[]>(() => [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const u = row.original
        const full = (u.profile?.displayName || u.profile?.fullName || u.clerkId)
        const initials = (full || '?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]?.toUpperCase()).join('') || '?'
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {(u.profile?.effectiveAvatarUrl || u.profile?.imageUrl) ? <AvatarImage src={(u.profile?.effectiveAvatarUrl || u.profile?.imageUrl) as string} alt={full} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{full}</span>
              <span className="text-xs text-muted-foreground">{u.profile?.username ? `@${u.profile.username}` : (u.profile?.email || u.clerkId)}</span>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) => <span className="text-sm">{row.original.profile?.username || '-'}</span>
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const u = row.original
        return (
          <span className="text-xs inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium">{ROLE_LABELS[u.role]}</span>
        )
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const u = row.original
        const deactivated = !!u.profile?.publicMetadata?.deactivated
        return (
          <span className={"text-xs inline-flex items-center rounded-md px-2 py-0.5 font-medium " + (deactivated ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700") }>
            {deactivated ? 'Deactivated' : 'Active'}
          </span>
        )
      }
    },
    {
      accessorKey: 'governorsCount',
      header: 'Linked',
      cell: ({ row }) => <span className="text-sm">{row.original.governorsCount}</span>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original
        const deactivated = !!user.profile?.publicMetadata?.deactivated
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => { setSelected(user); setViewOpen(true) }}>
                <Eye className="h-3.5 w-3.5 mr-2" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelected(user); setEditOpen(true) }}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setLinkUserId(user.clerkId); setPlayerId(""); setLinkOpen(true) }}>
                <Link2 className="h-3.5 w-3.5 mr-2" /> Link Governor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async ()=>{
                try {
                  const token = await getToken(); if (!token) throw new Error("Unauthorized")
                  const res = await fetch(`/api/v1/users/${encodeURIComponent(user.clerkId)}/revoke-sessions`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                  const body = await res.json().catch(()=>({}))
                  if (!res.ok) throw new Error(body?.message || 'Failed to revoke')
                  toast.success('Sessions revoked')
                } catch (e:any) {
                  toast.error(e.message || 'Failed')
                }
              }}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" /> Revoke Sessions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setConfirmInfo({ user, action: deactivated ? 'reactivate' : 'deactivate' })
                setConfirmOpen(true)
              }}>
                {deactivated ? <UserCheck className="h-3.5 w-3.5 mr-2" /> : <UserX className="h-3.5 w-3.5 mr-2" />} {deactivated ? 'Reactivate' : 'Deactivate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ], [getToken])

  return (
    <>
    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title={confirmInfo?.action === 'deactivate' ? 'Deactivate user?' : 'Reactivate user?'}
      description={confirmInfo?.action === 'deactivate' ? 'This will immediately revoke their access until reactivated.' : 'This will restore access to the user.'}
      confirmText={confirmInfo?.action === 'deactivate' ? 'Deactivate' : 'Reactivate'}
      confirmVariant={confirmInfo?.action === 'deactivate' ? 'destructive' : 'default'}
      loading={confirmBusy}
      onConfirm={async ()=>{
        if (!confirmInfo) return
        setConfirmBusy(true)
        try{
          const token = await getToken(); if (!token) throw new Error('Unauthorized')
          const res = await fetch(`/api/v1/users/${encodeURIComponent(confirmInfo.user.clerkId)}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: confirmInfo.action })
          })
          const body = await res.json().catch(()=>({}))
          if (!res.ok) throw new Error(body?.message || 'Failed')
          toast.success(body?.message || 'Updated')
          // refresh list
          const list = await fetch(`/api/v1/users`, { headers: { Authorization: `Bearer ${token}` } })
          const data = await list.json().catch(()=>({}))
          if (list.ok) setRows(data?.users ?? [])
          setConfirmOpen(false)
        }catch(e:any){ toast.error(e.message || 'Action failed') }
        finally{ setConfirmBusy(false); setConfirmInfo(null) }
      }}
    />
    <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable<UserRow>
              data={rows}
              columns={columns}
              loading={loading}
              error={error}
              pageSize={10}
              searchable
              searchKeys={["profile.displayName", "profile.fullName", "profile.username", "clerkId", "profile.email"]}
              searchPlaceholder="Search by name, username or email"
              initialSorting={[{ id: "user", desc: false }]}
            />
          </CardContent>
        </Card>
      )}
  </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Governor to User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <PlayerSearch value={playerId} onChange={setPlayerId} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={()=>setLinkOpen(false)}>Cancel</Button>
              <Button onClick={async ()=>{
                if (!linkUserId || !playerId) return
                try {
                  const token = await getToken(); if (!token) throw new Error('Unauthorized')
                  const res = await fetch(`/api/v1/users/${encodeURIComponent(linkUserId)}/link-governor`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ playerId })
                  })
                  const body = await res.json().catch(()=>({}))
                  if (!res.ok) throw new Error(body?.message || 'Failed to link')
                  toast.success('Linked')
                  setLinkOpen(false)
                  // refresh list
                  const list = await fetch(`/api/v1/users`, { headers: { Authorization: `Bearer ${token}` } })
                  const data = await list.json().catch(()=>({}))
                  if (list.ok) setRows(data?.users ?? [])
                } catch (e:any) {
                  toast.error(e.message || 'Link failed')
                }
              }}>Link</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <UserViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        user={selected}
        onAfterAction={async () => {
          const token = await getToken(); if (!token) return
          const res = await fetch(`/api/v1/users`, { headers: { Authorization: `Bearer ${token}` } })
          const body = await res.json().catch(()=>({}))
          if (res.ok) setRows(body?.users ?? [])
        }}
      />

      {/* Edit Dialog */}
      <UserEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={selected}
        onSaved={async () => {
          const token = await getToken(); if (!token) return
          const res = await fetch(`/api/v1/users`, { headers: { Authorization: `Bearer ${token}` } })
          const body = await res.json().catch(()=>({}))
          if (res.ok) setRows(body?.users ?? [])
        }}
      />
    </>
  )
}

// --- Dialogs ---
function PlayerSearch({ value, onChange }: { value: string; onChange: (v:string)=>void }){
  const { getToken } = useAuth()
  const [q, setQ] = useState("")
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(()=>{
    const t = setTimeout(async ()=>{
      try{
        setLoading(true)
        const token = await getToken(); if(!token) throw new Error('Unauthorized')
        const res = await fetch(`/api/v1/players?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(()=>({}))
        if (res.ok) setList(body?.players ?? [])
      }catch{} finally{ setLoading(false) }
    }, 250)
    return ()=>clearTimeout(t)
  },[q, getToken])
  return (
    <div className="space-y-2">
  <label className="text-sm font-medium">Search Governor</label>
      <Input placeholder="Name or RoK ID" value={q} onChange={(e)=>setQ(e.target.value)} />
      <div className="max-h-48 overflow-auto rounded border">
        {loading ? <Skeleton className="h-12 w-full"/> : (
          (list.length === 0 ? <div className="p-3 text-sm text-muted-foreground">No results</div> :
            list.map(p=> (
              <button key={p.id} className={"w-full text-left p-2 hover:bg-accent " + (value===p.id? 'bg-accent/50':'')} onClick={()=>onChange(p.id)}>
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs text-muted-foreground">#{p.rokId}{p?.alliance?.tag? ` • ${p.alliance.tag}`:''}</div>
              </button>
            ))
          )
        )}
      </div>
  {value ? <div className="text-xs text-muted-foreground">Selected governor id: {value}</div> : null}
    </div>
  )
}
function UserViewDialog({ open, onOpenChange, user, onAfterAction }: { open: boolean; onOpenChange:(v:boolean)=>void; user: UserRow | null; onAfterAction: ()=>void }) {
  const { getToken } = useAuth()
  const [detail, setDetail] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    let cancel=false
    async function load(){
      if (!open || !user) return
      setLoading(true)
      try{
        const token = await getToken(); if (!token) throw new Error('Unauthorized')
        const res = await fetch(`/api/v1/users/${encodeURIComponent(user.clerkId)}`, { headers: { Authorization: `Bearer ${token}` } })
        const body = await res.json().catch(()=>({}))
        if (!res.ok) throw new Error(body?.message || 'Failed to load')
        if (!cancel) setDetail(body)
      }catch(e:any){
        if(!cancel) toast.error(e.message || 'Failed')
      }finally{ if(!cancel) setLoading(false) }
    }
    load(); return ()=>{cancel=true}
  },[open, user, getToken])

  const full = (user?.profile?.displayName || user?.profile?.fullName || user?.clerkId || 'User')
  const initials = (full || '?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]?.toUpperCase()).join('') || '?'
  const deactivated = !!user?.profile?.publicMetadata?.deactivated

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex items-start justify-between">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Edit" onClick={()=>onOpenChange(false)}>
                    <Eye className="hidden" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit in other dialog</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Link" onClick={()=>{/* handled from row dialog normally */}}>
                    <Link2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Link Governor (use row action)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon" aria-label={deactivated? 'Reactivate':'Deactivate'}
                    onClick={async()=>{
                      if (!user) return
                      try{ const token = await getToken(); if(!token) throw new Error('Unauthorized')
                        const res = await fetch(`/api/v1/users/${encodeURIComponent(user.clerkId)}/status`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ action: deactivated?'reactivate':'deactivate' }) })
                        const body = await res.json().catch(()=>({}))
                        if(!res.ok) throw new Error(body?.message || 'Failed')
                        toast.success(body?.message || 'Updated')
                        onAfterAction()
                      }catch(e:any){ toast.error(e.message || 'Failed') }
                    }}
                  >
                    {deactivated ? <UserCheck className="h-4 w-4"/> : <UserX className="h-4 w-4"/>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{deactivated ? 'Reactivate' : 'Deactivate'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost" size="icon" aria-label="Revoke Sessions"
                    onClick={async()=>{
                      if (!user) return
                      try{ const token = await getToken(); if(!token) throw new Error('Unauthorized')
                        const res = await fetch(`/api/v1/users/${encodeURIComponent(user.clerkId)}/revoke-sessions`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } })
                        const body = await res.json().catch(()=>({}))
                        if(!res.ok) throw new Error(body?.message || 'Failed')
                        toast.success('Sessions revoked')
                      }catch(e:any){ toast.error(e.message || 'Failed') }
                    }}
                  >
                    <RefreshCw className="h-4 w-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Revoke Sessions</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {(user?.profile?.effectiveAvatarUrl || user?.profile?.imageUrl) ? <AvatarImage src={(user?.profile?.effectiveAvatarUrl || user?.profile?.imageUrl) as string} alt={full}/> : null}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-lg">{full}</span>
            <span className="text-sm text-muted-foreground">{user?.profile?.username ? `@${user.profile.username}` : (user?.profile?.email || user?.clerkId)}</span>
            <div className="flex gap-2 mt-1">
              <span className="text-xs inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium">{ROLE_LABELS[user?.role || 'KINGDOM_MEMBER' as Role]}</span>
              <span className={"text-xs inline-flex items-center rounded-md px-2 py-0.5 font-medium " + (deactivated ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700") }>
                {deactivated ? "Deactivated" : "Active"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold">Linked Governors</h4>
          {loading ? <Skeleton className="h-20 w-full"/> : (
            <div className="space-y-1 max-h-48 overflow-auto">
              {(detail?.governors ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No linked governors.</p>
              ) : (
                (detail?.governors ?? []).map((p:any)=> (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">#{p.rokId}{p?.alliance?.tag ? ` • ${p.alliance.tag}`: ''}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function UserEditDialog({ open, onOpenChange, user, onSaved }: { open:boolean; onOpenChange:(v:boolean)=>void; user: UserRow | null; onSaved: ()=>void }){
  const { getToken } = useAuth()
  const [firstName, setFirstName] = useState(user?.profile?.firstName || "")
  const [lastName, setLastName] = useState(user?.profile?.lastName || "")
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.appAvatarUrl || user?.profile?.imageUrl || "")
  const [displayName, setDisplayName] = useState(user?.profile?.displayName || "")
  const [username, setUsername] = useState(user?.profile?.username || "")
  const [commanderAvatarId, setCommanderAvatarId] = useState(user?.profile?.commanderAvatarId || "")
  const [profileColor, setProfileColor] = useState("")
  const [socials, setSocials] = useState("{}")
  const [role, setRole] = useState<Role>(user?.role || "KINGDOM_MEMBER")

  useEffect(()=>{
    setFirstName(user?.profile?.firstName || "")
    setLastName(user?.profile?.lastName || "")
  setAvatarUrl(user?.profile?.appAvatarUrl || user?.profile?.imageUrl || "")
  setDisplayName(user?.profile?.displayName || "")
  setUsername(user?.profile?.username || "")
  setCommanderAvatarId(user?.profile?.commanderAvatarId || "")
    setRole(user?.role || "KINGDOM_MEMBER")
  },[user, open])

  async function save(){
    if (!user) return
    try{
      const token = await getToken(); if(!token) throw new Error('Unauthorized')
      // Update core fields
  const body: any = { firstName, lastName, avatarUrl, profileColor, displayName, username, commanderAvatarId }
      try { body.socials = JSON.parse(socials || "{}") } catch {}
      const res = await fetch(`/api/v1/users/${encodeURIComponent(user.clerkId)}`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify(body)
      })
      const data = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(data?.message || 'Failed to save')

      // Update role if changed
      if (role && role !== user.role){
        const rr = await fetch(`/api/v1/users/${encodeURIComponent(user.clerkId)}/role`, {
          method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ role })
        })
        const rb = await rr.json().catch(()=>({}))
        if (!rr.ok) throw new Error(rb?.message || 'Failed to update role')
      }

      toast.success('Saved')
      onOpenChange(false)
      onSaved()
    }catch(e:any){ toast.error(e.message || 'Save failed') }
  }

  const deactivated = !!user?.profile?.publicMetadata?.deactivated

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex items-start justify-between">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Deactivate/Reactivate"
                    onClick={async()=>{
                      if(!user) return
                      try{ const token = await getToken(); if(!token) throw new Error('Unauthorized')
                        const res = await fetch(`/api/v1/users/${encodeURIComponent(user.clerkId)}/status`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body: JSON.stringify({ action: deactivated?'reactivate':'deactivate' }) })
                        const b = await res.json().catch(()=>({}))
                        if(!res.ok) throw new Error(b?.message || 'Failed')
                        toast.success(b?.message || 'Updated')
                      }catch(e:any){ toast.error(e.message || 'Failed') }
                    }}
                  >
                    {deactivated ? <UserCheck className="h-4 w-4"/> : <UserX className="h-4 w-4"/>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{deactivated ? 'Reactivate' : 'Deactivate'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Revoke Sessions"
                    onClick={async()=>{
                      if(!user) return
                      try{ const token = await getToken(); if(!token) throw new Error('Unauthorized')
                        const res = await fetch(`/api/v1/users/${encodeURIComponent(user.clerkId)}/revoke-sessions`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } })
                        const b = await res.json().catch(()=>({}))
                        if(!res.ok) throw new Error(b?.message || 'Failed')
                        toast.success('Sessions revoked')
                      }catch(e:any){ toast.error(e.message || 'Failed') }
                    }}
                  >
                    <RefreshCw className="h-4 w-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Revoke Sessions</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">First Name</label>
            <Input value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name</label>
            <Input value={lastName} onChange={(e)=>setLastName(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Avatar URL</label>
            <Input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input value={displayName} onChange={(e)=>setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="no spaces" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Commander Avatar ID</label>
            <Input value={commanderAvatarId} onChange={(e)=>setCommanderAvatarId(e.target.value)} placeholder="UUID of commander to use as avatar" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Profile Color</label>
            <Input value={profileColor} placeholder="#ffaa00" onChange={(e)=>setProfileColor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(v)=>setRole(v as Role)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="KINGDOM_MEMBER">Member</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Socials (JSON)</label>
            <Textarea value={socials} onChange={(e)=>setSocials(e.target.value)} rows={4} />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}><ShieldCheck className="h-4 w-4 mr-1"/>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

