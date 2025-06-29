export enum Slot {
  HEAD = 'HEAD',
  CHEST = 'CHEST',
  ARMS = 'ARMS',
  LEGS = 'LEGS',
  WEAPON = 'WEAPON',
  GEAR = 'GEAR', // For things like optical camo, etc.
}

export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  ICONIC = 'ICONIC', // Iconic can be a rarity itself or a characteristic of Legendary
}

export interface Attribute {
  id: string;
  name: string;
  description?: string;
  isIconic?: boolean;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
}

export interface EquipmentNormalAttributeForm {
  attributeId: string;
  value: string;
}

export interface EquipmentIconicAttributeForm {
  attributeId: string;
  value: string;
  tier: number;
}

export interface EquipmentMaterialForm {
  materialId: string;
  quantity: number;
}

export interface EquipmentFormData {
  name: string;
  slot: Slot;
  rarity: Rarity;
  src: string;
  alt: string;
  normalAttributes: EquipmentNormalAttributeForm[];
  iconicAttributes: EquipmentIconicAttributeForm[];
  materials: EquipmentMaterialForm[];
}