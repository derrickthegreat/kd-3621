import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Attribute, EquipmentIconicAttributeForm } from '@/lib/types/equipment';
import AttributeCombobox from './attribute-combobox';

interface IconicAttributesSectionProps {
  iconicAttributes: EquipmentIconicAttributeForm[];
  availableAttributes: Attribute[];
  handleIconicAttributeChange: (index: number, field: 'attributeId' | 'value') => (val: string) => void;
  iconicAttrOpen: boolean[];
  setIconicAttrOpen: React.Dispatch<React.SetStateAction<boolean[]>>;
  setShowAddAttributeDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentComboboxContext: React.Dispatch<React.SetStateAction<{ type: 'normalAttribute' | 'iconicAttribute' | 'material'; index: number } | null>>;
}

const IconicAttributesSection: React.FC<IconicAttributesSectionProps> = ({
  iconicAttributes,
  availableAttributes,
  handleIconicAttributeChange,
  iconicAttrOpen,
  setIconicAttrOpen,
  setShowAddAttributeDialog,
  setCurrentComboboxContext,
}) => {
  return (
    <div className="space-y-3 pt-4 border-t">
      <p className="text-sm text-gray-600 mb-2">Iconic Attributes (Tiers 1-5):</p>
      {iconicAttributes.map((attr, index) => (
        <div key={index} className="flex items-end gap-2">
          <div className="w-16 flex-shrink-0">
            <Label htmlFor={`iconic-tier-${attr.tier}`}>Tier {attr.tier}</Label>
          </div>
          <div className="flex-1">
            <Label htmlFor={`iconic-attr-name-${index}`} className="sr-only">Attribute Name</Label>
            <AttributeCombobox
              id={`iconic-attr-name-${index}`}
              value={attr.attributeId}
              onSelect={(attributeId) => handleIconicAttributeChange(index, 'attributeId')(attributeId)}
              availableAttributes={availableAttributes}
              onAddNew={() => {
                setShowAddAttributeDialog(true);
                setCurrentComboboxContext({ type: 'iconicAttribute', index });
              }}
              openState={iconicAttrOpen[index]}
              onOpenChange={(open) => {
                const newStates = [...iconicAttrOpen];
                newStates[index] = open;
                setIconicAttrOpen(newStates);
              }}
              filterIconic={true} // Only show iconic attributes
            />
          </div>
          <div className="min-w-[100px] flex-shrink-0">
            <Label htmlFor={`iconic-attr-value-${index}`} className="sr-only">Value</Label>
            <Input
              type="text"
              id={`iconic-attr-value-${index}`}
              value={attr.value}
              onChange={(e) => handleIconicAttributeChange(index, 'value')(e.target.value)}
              placeholder="Value"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default IconicAttributesSection;