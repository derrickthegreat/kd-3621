import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import MaterialCombobox from './material-combobox'; // Relative path
import { Material, EquipmentMaterialForm } from '@/lib/types/equipment';

interface MaterialsSectionProps {
  materials: EquipmentMaterialForm[];
  availableMaterials: Material[];
  handleMaterialChange: (index: number, field: 'materialId' | 'quantity') => (val: string | number) => void;
  addMaterial: () => void;
  removeMaterial: (index: number) => void;
  materialOpen: boolean[];
  setMaterialOpen: React.Dispatch<React.SetStateAction<boolean[]>>;
  setShowAddMaterialDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentComboboxContext: React.Dispatch<React.SetStateAction<{ type: 'normalAttribute' | 'iconicAttribute' | 'material'; index: number } | null>>;
}

const MaterialsSection: React.FC<MaterialsSectionProps> = ({
  materials,
  availableMaterials,
  handleMaterialChange,
  addMaterial,
  removeMaterial,
  materialOpen,
  setMaterialOpen,
  setShowAddMaterialDialog,
  setCurrentComboboxContext,
}) => {
  return (
    <div className="space-y-3">
      {materials.map((mat, index) => (
        <div key={index} className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor={`material-name-${index}`} className="sr-only">Material Name</Label>
            <MaterialCombobox
              id={`material-name-${index}`}
              value={mat.materialId}
              onSelect={(materialId) => handleMaterialChange(index, 'materialId')(materialId)}
              availableMaterials={availableMaterials}
              onAddNew={() => {
                setShowAddMaterialDialog(true);
                setCurrentComboboxContext({ type: 'material', index });
              }}
              openState={materialOpen[index]}
              onOpenChange={(open) => {
                const newStates = [...materialOpen];
                newStates[index] = open;
                setMaterialOpen(newStates);
              }}
            />
          </div>
          <div className="min-w-[100px] flex-shrink-0">
            <Label htmlFor={`material-quantity-${index}`} className="sr-only">Quantity</Label>
            <Input
              type="number"
              id={`material-quantity-${index}`}
              value={mat.quantity}
              onChange={(e) => handleMaterialChange(index, 'quantity')(e.target.value)}
              placeholder="Qty"
              min="1"
            />
          </div>
          <Button type="button" variant="destructive" size="icon" onClick={() => removeMaterial(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full" onClick={addMaterial}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Material
      </Button>
    </div>
  );
};

export default MaterialsSection;