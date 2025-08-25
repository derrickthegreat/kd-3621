"use client"

import { Button } from "./button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog"

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "destructive",
  loading = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: React.ComponentProps<typeof Button>["variant"]
  loading?: boolean
  onConfirm: () => void | Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!loading) onOpenChange(v) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={loading}>{cancelText}</Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={loading}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
