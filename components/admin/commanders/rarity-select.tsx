"use client"

type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | undefined

export function RaritySelect({ value, onChange, disabled }: { value: Rarity, onChange: (v: Rarity) => void, disabled?: boolean }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">Rarity</label>
      <select
        className="border rounded px-3 py-2 text-sm"
        disabled={disabled}
        value={value || ''}
        onChange={(e) => onChange((e.target.value || undefined) as Rarity)}
      >
        <option value="">Select rarity</option>
        <option value="COMMON">Common</option>
        <option value="UNCOMMON">Uncommon</option>
        <option value="RARE">Rare</option>
        <option value="EPIC">Epic</option>
        <option value="LEGENDARY">Legendary</option>
      </select>
    </div>
  )
}

export function formatRarityLabel(r?: Rarity) {
  return r === 'LEGENDARY' ? 'Legendary' : r === 'EPIC' ? 'Epic' : r === 'RARE' ? 'Rare' : r === 'UNCOMMON' ? 'Uncommon' : r === 'COMMON' ? 'Common' : ''
}
