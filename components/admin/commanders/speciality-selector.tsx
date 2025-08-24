"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { TROOP_TYPES, SPEC_LABELS } from "./constants"
import { toast } from "sonner"

export function SpecialitySelector({ value, onChange, disabled }: { value: string[], onChange: (v: string[]) => void, disabled?: boolean }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Speciality</label>
      <div className="grid grid-cols-2 gap-2 max-h-44 overflow-auto border rounded p-2">
        {TROOP_TYPES.map((t) => {
          const checked = value.includes(t)
          const atLimit = !checked && value.length >= 3
          return (
            <label key={t} className="flex items-center gap-2 text-sm opacity-100">
              <Checkbox
                disabled={disabled || atLimit}
                checked={checked}
                onCheckedChange={(v) => {
                  if (disabled) return
                  onChange((prev => {
                    const next = new Set(prev)
                    if (v) {
                      if (next.size >= 3) {
                        toast('You can select up to 3 specialities')
                        return prev
                      }
                      next.add(t)
                    } else {
                      next.delete(t)
                    }
                    return Array.from(next)
                  })(value))
                }}
              />
              <span>{SPEC_LABELS[t] || t}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
