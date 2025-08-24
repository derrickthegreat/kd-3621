#!/usr/bin/env node
/*
  Enrich equipments.json with name-based attributes/iconic/materials so the importer can map them.

  - Reads: ./public/data/equipments.json
  - Optional mapping: ./public/data/import-mapping.json
    {
      "attributesOrder": ["Attack","Defense","Health"],
      "iconicAttributesOrder": ["Attack","Defense","Health"],
      "materialsOrder": ["Leather","Iron Ore","Animal Bone","Ebony","Gold"]
    }
  - Writes: ./public/data/equipments.enriched.json
*/

const fs = require('fs')
const path = require('path')

function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return fallback }
}

const root = process.cwd()
const inPath = path.join(root, 'public', 'data', 'equipments.json')
const mappingPath = path.join(root, 'public', 'data', 'import-mapping.json')
const outPath = path.join(root, 'public', 'data', 'equipments.enriched.json')

if (!fs.existsSync(inPath)) {
  console.error('Input not found:', inPath)
  process.exit(1)
}

const mapping = readJSON(mappingPath, {
  attributesOrder: ['Attack','Defense','Health'],
  iconicAttributesOrder: ['Attack','Defense','Health'],
  materialsOrder: ['Leather','Iron Ore','Animal Bone','Ebony','Gold']
})

const input = readJSON(inPath, [])
if (!Array.isArray(input)) {
  console.error('equipments.json must be an array')
  process.exit(1)
}

function toPercentLike(v) {
  // Leave as-is if string already contains % or is not a number
  if (typeof v === 'string') return v
  if (typeof v === 'number') return v // keep numeric; UI accepts strings like "4.5%" but server stores as string
  return v
}

const out = input.map((row) => {
  const copy = { ...row }

  // Attributes by name
  if (Array.isArray(row.attributes)) {
    const attrs = []
    const order = Array.isArray(mapping.attributesOrder) ? mapping.attributesOrder : []
    for (let i = 0; i < row.attributes.length; i++) {
      const it = row.attributes[i]
      const name = order[i]
      if (!name) continue
      const value = it?.value ?? it
      attrs.push({ name, value: toPercentLike(value) })
    }
    if (attrs.length) copy.attributesByName = attrs
  }

  // Iconic by name
  if (Array.isArray(row.iconic)) {
    const iconics = []
    const order = Array.isArray(mapping.iconicAttributesOrder) ? mapping.iconicAttributesOrder : []
    for (let i = 0; i < row.iconic.length; i++) {
      const it = row.iconic[i]
      const name = order[i]
      if (!name) continue
      const value = it?.value
      const tier = it?.tier
      iconics.push({ name, value: value ?? null, tier: typeof tier === 'number' ? tier : null })
    }
    if (iconics.length) copy.iconicByName = iconics
  }

  // Materials by name
  if (Array.isArray(row.materials)) {
    const mats = []
    const order = Array.isArray(mapping.materialsOrder) ? mapping.materialsOrder : []
    for (let i = 0; i < row.materials.length; i++) {
      const it = row.materials[i]
      const name = order[i]
      if (!name) continue
      const quantity = it?.quantity ?? it?.value ?? it ?? 1
      const rarity = it?.rarity ?? null
      mats.push({ name, quantity, rarity })
    }
    if (mats.length) copy.materialsByName = mats
  }

  return copy
})

fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log('Wrote', outPath)
