"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type CommanderOption = { id: string; name: string; iconUrl: string }

export function CommanderSelect({
  value,
  onChange,
  options,
  placeholder = 'Select commander',
  disabled,
}: {
  value?: string
  onChange: (v: string) => void
  options: CommanderOption[]
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
