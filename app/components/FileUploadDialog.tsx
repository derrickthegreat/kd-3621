"use client"

import { useRef, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Loader2 } from "lucide-react"

type FileUploadDialogProps<T = any> = {
  open: boolean
  onOpenChange: (v: boolean) => void
  title?: string
  description?: string
  accept?: string
  allowMultiple?: boolean
  parseFile: (file: File) => Promise<T[]>
  onConfirm: (items: T[], onProgress?: (processed: number, total: number) => void) => Promise<void> | void
  confirmLabel?: string
}

export function FileUploadDialog<T = any>({
  open,
  onOpenChange,
  title = "Upload Files",
  description = "Drag and drop files here or click to browse",
  accept = ".csv,.xlsx,.xls,.json",
  allowMultiple = true,
  parseFile,
  onConfirm,
  confirmLabel = "Upload",
}: FileUploadDialogProps<T>) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null)
  const [items, setItems] = useState<T[]>([])
  const [filesInfo, setFilesInfo] = useState<Array<{ name: string; ext: string; count: number; size: number }>>([])

  function resetState() {
    setItems([])
    setFilesInfo([])
  setProgress(null)
    setDragOver(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function parseFiles(fs: FileList | File[]) {
    const files = Array.from(fs)
    if (!files.length) return
    const results = await Promise.all(files.map(parseFile))
    setItems(results.flat())
    setFilesInfo(files.map((f, i) => ({
      name: f.name,
      ext: (f.name.split('.').pop() || '').toLowerCase(),
      count: results[i]?.length || 0,
      size: f.size,
    })))
  }

  async function handleConfirm() {
    if (!items.length) return
    setBusy(true)
    setProgress({ processed: 0, total: items.length })
    try {
      await onConfirm(items, (processed, total) => setProgress({ processed, total }))
      resetState()
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
  <Dialog open={open} onOpenChange={(v) => { if (!busy) { if (!v) resetState(); onOpenChange(v) } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple={allowMultiple}
            accept={accept}
            onChange={(e) => { if (e.target.files) parseFiles(e.target.files) }}
          />
          <div
            className={
              `flex flex-col items-center justify-center rounded-md border-2 border-dashed p-6 cursor-pointer transition-colors text-center ` +
              (dragOver ? 'border-primary/60 bg-primary/5' : 'border-muted-foreground/20 hover:bg-muted/30')
            }
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) parseFiles(e.dataTransfer.files) }}
          >
            <div className="mb-2 text-muted-foreground">
              <ImageIcon className="inline-block h-8 w-8" />
            </div>
            <p className="text-sm">
              <button type="button" className="text-primary underline underline-offset-2" onClick={(e) => { e.preventDefault(); inputRef.current?.click() }}>
                Upload a file
              </button> or drag and drop
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          {filesInfo.length ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Parsed {items.length} item(s) from {filesInfo.length} file(s):</div>
              <ul className="max-h-40 overflow-auto divide-y rounded-md border bg-muted/40">
                {filesInfo.map((f, idx) => (
                  <li key={`${f.name}-${idx}`} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.ext.toUpperCase()} • {f.count} item(s)</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{(f.size/1024).toFixed(1)} KB</div>
                  </li>
                ))}
              </ul>
              {progress ? (
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.round((progress.processed / Math.max(1, progress.total)) * 100))}%` }} />
                  </div>
                  <div className="text-xs text-muted-foreground">{progress.processed} / {progress.total} processed</div>
                </div>
              ) : null}
              {busy ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading… Please keep this dialog open.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No files selected.</div>
          )}
        </div>
        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => { if (!busy) { resetState(); onOpenChange(false) } }} disabled={busy}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={busy || !items.length}>
            {busy ? (<span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</span>) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
