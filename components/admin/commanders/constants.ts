"use client"

export const TROOP_TYPES = [
  "CAVALRY","INFANTRY","ARCHERY","ENGINEERING","LEADERSHIP","GATHERING","PEACEKEEPING","ATTACK","CONQUERING","COMBO","DEFENSE","GARRISON","SKILL","SMITE","SUPPORT","VERSATILITY",
] as const

export const SPEC_LABELS: Record<string, string> = {
  CAVALRY: 'Cavalry',
  INFANTRY: 'Infantry',
  ARCHERY: 'Archery',
  ENGINEERING: 'Engineering',
  LEADERSHIP: 'Leadership',
  GATHERING: 'Gathering',
  PEACEKEEPING: 'Peacekeeping',
  ATTACK: 'Attack',
  CONQUERING: 'Conquering',
  COMBO: 'Combo',
  DEFENSE: 'Defense',
  GARRISON: 'Garrison',
  SKILL: 'Skill',
  SMITE: 'Smite',
  SUPPORT: 'Support',
  VERSATILITY: 'Versatility',
}
