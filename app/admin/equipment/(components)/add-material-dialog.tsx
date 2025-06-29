import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description: string;
  onDescriptionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: () => void;
  isAdding: boolean;
}

const AddMaterialDialog: React.FC<AddMaterialDialogProps> = ({
  open,
  onOpenChange,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  onAdd,
  isAdding,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>
            Enter the details for the new material.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-material-name" className="text-right">
              Name
            </Label>
            <Input
              id="new-material-name"
              value={name}
              onChange={onNameChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-material-description" className="text-right">
              Description
            </Label>
            <Input
              id="new-material-description"
              value={description}
              onChange={onDescriptionChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAdd} disabled={isAdding || !name.trim()}>
            {isAdding ? 'Adding...' : 'Add Material'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaterialDialog;