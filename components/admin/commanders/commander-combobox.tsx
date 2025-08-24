"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { CheckIcon, ChevronsUpDown } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export type CommanderOption = { id: string; name: string; iconUrl: string }

export function CommanderCombobox({
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
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => options.find(o => o.id === value), [options, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          variant="outline"
          disabled={disabled}
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              {selected.iconUrl ? (
                <Image src={selected.iconUrl} alt={selected.name} width={24} height={24} className="rounded-full" />
              ) : null}
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search commanders..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Commanders">
              {options.map((o) => (
                <CommandItem
                  key={o.id}
                  value={`${o.name} ${o.id}`}
                  onSelect={() => { onChange(o.id); setOpen(false) }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {o.iconUrl ? (
                      <Image src={o.iconUrl} alt={o.name} width={24} height={24} className="rounded-full" />
                    ) : null}
                    <span className="truncate">{o.name}</span>
                  </div>
                  <CheckIcon className={cn("ml-auto h-4 w-4", value === o.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
