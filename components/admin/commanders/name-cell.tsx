"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function NameCell({ name, iconUrl, onClick }: { name: string, iconUrl: string, onClick?: () => void }) {
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?"
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={iconUrl} alt={name} />
        <AvatarFallback className="text-[12px]">{initials}</AvatarFallback>
      </Avatar>
  <div className="flex items-center gap-2">
        {onClick ? (
          <button type="button" onClick={onClick} className="font-medium hover:underline text-left">
            {name}
          </button>
        ) : (
          <span className="font-medium">{name}</span>
        )}
      </div>
    </div>
  )
}
