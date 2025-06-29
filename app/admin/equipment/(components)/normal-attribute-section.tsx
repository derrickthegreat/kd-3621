import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import AttributeCombobox from './attribute-combobox'; // Relative path
import { Attribute, EquipmentNormalAttributeForm } from '@/lib/types/equipment';

interface NormalAttributesSectionProps {
  normalAttributes: EquipmentNormalAttributeForm[];
  availableAttributes: Attribute[];
  handleNormalAttributeChange: (index: number, field: 'attributeId' | 'value') => (val: string) => void;
  addNormalAttribute: () => void;
  removeNormalAttribute: (index: number) => void;
  normalAttrOpen: boolean[];
  setNormalAttrOpen: React.Dispatch<React.SetStateAction<boolean[]>>;
  setShowAddAttributeDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentComboboxContext: React.Dispatch<React.SetStateAction<{ type: 'normalAttribute' | 'iconicAttribute' | 'material'; index: number } | null>>;
}

const NormalAttributesSection: React.FC<NormalAttributesSectionProps> = ({
  normalAttributes,
  availableAttributes,
  handleNormalAttributeChange,
  addNormalAttribute,
  removeNormalAttribute,
  normalAttrOpen,
  setNormalAttrOpen,
  setShowAddAttributeDialog,
  setCurrentComboboxContext,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-2">Normal Attributes:</p>
      {normalAttributes.map((attr, index) => (
        <div key={index} className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor={`normal-attr-name-${index}`} className="sr-only">Attribute Name</Label>
            <AttributeCombobox
              id={`normal-attr-name-${index}`}
              value={attr.attributeId}
              onSelect={(attributeId) => handleNormalAttributeChange(index, 'attributeId')(attributeId)}
              availableAttributes={availableAttributes}
              onAddNew={() => {
                setShowAddAttributeDialog(true);
                setCurrentComboboxContext({ type: 'normalAttribute', index });
              }}
              openState={normalAttrOpen[index]}
              onOpenChange={(open) => {
                const newStates = [...normalAttrOpen];
                newStates[index] = open;
                setNormalAttrOpen(newStates);
              }}
              filterIconic={false}
            />
          </div>
          <div className="min-w-[100px] flex-shrink-0">
            <Label htmlFor={`normal-attr-value-${index}`} className="sr-only">Value</Label>
            <Input
              type="text"
              id={`normal-attr-value-${index}`}
              value={attr.value}
              onChange={(e) => handleNormalAttributeChange(index, 'value')(e.target.value)}
              placeholder="Value"
            />
          </div>
          <Button type="button" variant="destructive" size="icon" onClick={() => removeNormalAttribute(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full" onClick={addNormalAttribute}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Normal Attribute
      </Button>
    </div>
  );
};

export default NormalAttributesSection;