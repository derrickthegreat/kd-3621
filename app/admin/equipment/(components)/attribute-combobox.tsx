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
import { Label } from '@/components/ui/label';
import { PlusCircle, ChevronsUpDown } from 'lucide-react';
import CheckIcon from '@/components/icons/CheckIcon'; // Assuming you create this file
import { cn } from '@/lib/utils';
import { Attribute } from '@/lib/types/equipment';

interface AttributeComboboxProps {
  id: string;
  value: string;
  onSelect: (attributeId: string) => void;
  availableAttributes: Attribute[];
  onAddNew: () => void;
  openState: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  filterIconic?: boolean; // To filter for normal or iconic attributes
}

const AttributeCombobox: React.FC<AttributeComboboxProps> = ({
  id,
  value,
  onSelect,
  availableAttributes,
  onAddNew,
  openState,
  onOpenChange,
  placeholder = 'Select attribute',
  searchPlaceholder = 'Search attribute...',
  filterIconic = false,
}) => {
  const filteredAttributes = availableAttributes.filter(a =>
    filterIconic ? a.isIconic : !a.isIconic
  );

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
            ? filteredAttributes.find((a) => a.id === value)?.name
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-sm">No attribute found.</CommandEmpty>
            <CommandGroup>
              {filteredAttributes.map((attribute) => (
                <CommandItem
                  key={attribute.id}
                  value={attribute.name}
                  onSelect={() => onSelect(attribute.id)}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === attribute.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate block flex-1 min-w-0">{attribute.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup className="border-t">
              <CommandItem onSelect={onAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Attribute
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AttributeCombobox;