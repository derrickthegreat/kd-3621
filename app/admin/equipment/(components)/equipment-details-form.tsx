import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slot, Rarity, EquipmentFormData } from '@/lib/types/equipment';

interface EquipmentDetailsFormProps {
  formData: EquipmentFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: keyof EquipmentFormData) => (value: string) => void;
}

const EquipmentDetailsForm: React.FC<EquipmentDetailsFormProps> = ({
  formData,
  handleInputChange,
  handleSelectChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Equipment Details</h3>
      <div>
        <Label htmlFor="name">Equipment Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div>
        <Label htmlFor="slot">Slot</Label>
        <Select onValueChange={handleSelectChange('slot')} value={formData.slot}>
          <SelectTrigger id="slot">
            <SelectValue placeholder="Select a slot" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Slot).map((slotOption) => (
              <SelectItem key={slotOption} value={slotOption}>
                {slotOption.charAt(0) + slotOption.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="rarity">Rarity</Label>
        <Select onValueChange={handleSelectChange('rarity')} value={formData.rarity}>
          <SelectTrigger id="rarity">
            <SelectValue placeholder="Select a rarity" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Rarity).map((rarityOption) => (
              <SelectItem key={rarityOption} value={rarityOption}>
                {rarityOption.charAt(0) + rarityOption.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="src">Image Source (URL)</Label>
        <Input
          type="url"
          id="src"
          name="src"
          value={formData.src}
          onChange={handleInputChange}
          placeholder="e.g., https://placehold.co/100x100"
          required
        />
      </div>

      <div>
        <Label htmlFor="alt">Image Alt Text</Label>
        <Input
          type="text"
          id="alt"
          name="alt"
          value={formData.alt}
          onChange={handleInputChange}
          required
        />
      </div>
    </div>
  );
};

export default EquipmentDetailsForm;