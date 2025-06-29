import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { PlusCircle, ChevronsUpDown } from 'lucide-react';
import CheckIcon from '@/components/icons/CheckIcon'; // Assuming you create this file
import { cn } from '@/lib/utils';
import { Material } from '@/lib/types/equipment';

interface MaterialComboboxProps {
  id: string;
  value: string;
  onSelect: (materialId: string) => void;
  availableMaterials: Material[];
  onAddNew: () => void;
  openState: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

const MaterialCombobox: React.FC<MaterialComboboxProps> = ({
  id,
  value,
  onSelect,
  availableMaterials,
  onAddNew,
  openState,
  onOpenChange,
  placeholder = 'Select material',
  searchPlaceholder = 'Search material...',
}) => {
  return (
    <Popover open={openState} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
          id={id}
        >
          {value
            ? availableMaterials.find((m) => m.id === value)?.name
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm">No material found.</CommandEmpty>
            <CommandGroup>
              {availableMaterials.map((material) => (
                <CommandItem
                  key={material.id}
                  value={material.name}
                  onSelect={() => onSelect(material.id)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === material.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate block flex-1 min-w-0">{material.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup className="border-t">
              <CommandItem onSelect={onAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Material
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MaterialCombobox;