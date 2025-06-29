'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import shared types
import { Rarity, Slot, Attribute, Material, EquipmentFormData } from '@/lib/types/equipment';

// Import all refactored components from the centralized index.ts
import StatusMessage from '@/components/ui/status-message';
import EquipmentDetailsForm from './(components)/equipment-details-form';
import NormalAttributesSection from './(components)/normal-attribute-section';
import IconicAttributesSection from './(components)/iconic-attribute-section';
import MaterialsSection from './(components)/materials-section';
import AddAttributeDialog from './(components)/add-attribute-dialog';
import AddMaterialDialog from './(components)/add-material-dialog';
import { Input } from '@/components/ui/input';

type UIMode = 'choose' | 'manual' | 'json';

const AddEquipmentPage: React.FC = () => {
  const [uiMode, setUiMode] = useState<UIMode>('choose'); // New state for controlling UI mode

  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    slot: Slot.HEAD,
    rarity: Rarity.COMMON,
    src: '',
    alt: '',
    normalAttributes: [],
    iconicAttributes: Array.from({ length: 5 }, (_, i) => ({
      attributeId: '',
      value: '',
      tier: i + 1,
    })),
    materials: [],
  });
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [availableAttributes, setAvailableAttributes] = useState<Attribute[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);

  const [showAddAttributeDialog, setShowAddAttributeDialog] = useState<boolean>(false);
  const [newAttributeName, setNewAttributeName] = useState<string>('');
  const [newAttributeDescription, setNewAttributeDescription] = useState<string>('');
  const [addingAttribute, setAddingAttribute] = useState<boolean>(false);

  const [showAddMaterialDialog, setShowAddMaterialDialog] = useState<boolean>(false);
  const [newMaterialName, setNewMaterialName] = useState<string>('');
  const [newMaterialDescription, setNewMaterialDescription] = useState<string>('');
  const [addingMaterial, setAddingMaterial] = useState<boolean>(false);

  // Context for which combobox triggered the add dialog
  const [currentComboboxContext, setCurrentComboboxContext] = useState<
    { type: 'normalAttribute' | 'iconicAttribute' | 'material'; index: number } | null
  >(null);

  // Open/close states for individual comboboxes
  const [normalAttrOpen, setNormalAttrOpen] = useState<boolean[]>([]);
  const [iconicAttrOpen, setIconicAttrOpen] = useState<boolean[]>(Array(5).fill(false));
  const [materialOpen, setMaterialOpen] = useState<boolean[]>([]);

  // State for JSON upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploadingJson, setIsUploadingJson] = useState<boolean>(false);

  // --- Data Fetching ---
  const fetchAttributes = async () => {
    try {
      const response = await fetch('/api/equipment/attributes');
      if (!response.ok) {
        throw new Error('Failed to fetch attributes');
      }
      const data: Attribute[] = await response.json();
      setAvailableAttributes(data);
      // Re-initialize normalAttrOpen based on current normalAttributes length
      setNormalAttrOpen(Array(formData.normalAttributes.length).fill(false));
    } catch (error: any) {
      console.error('Failed to fetch available attributes:', error);
      setMessage('Failed to load attributes. Please try again.');
      setIsError(true);
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/equipment/materials');
      if (!response.ok) {
        throw new Error('Failed to fetch materials');
      }
      const data: Material[] = await response.json();
      setAvailableMaterials(data);
      // Re-initialize materialOpen based on current materials length
      setMaterialOpen(Array(formData.materials.length).fill(false));
    } catch (error: any) {
      console.error('Failed to fetch available materials:', error);
      setMessage('Failed to load materials. Please try again.');
      setIsError(true);
    }
  };

  // Effect to fetch initial data on component mount
  useEffect(() => {
    fetchAttributes();
    fetchMaterials();
  }, []);

  // --- Form Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: keyof EquipmentFormData) => (value: string) => {
    setFormData((prevData) => {
      let updatedData = {
        ...prevData,
        [name]: value as Slot | Rarity,
      };

      if (name === 'rarity') {
        const newRarity = value as Rarity;
        if (newRarity !== Rarity.LEGENDARY) {
          updatedData.iconicAttributes = Array.from({ length: 5 }, (_, i) => ({
            attributeId: '',
            value: '',
            tier: i + 1,
          }));
          setIconicAttrOpen(Array(5).fill(false));
        } else {
          if (updatedData.iconicAttributes.length === 0) {
            updatedData.iconicAttributes = Array.from({ length: 5 }, (_, i) => ({
              attributeId: '',
              value: '',
              tier: i + 1,
            }));
            setIconicAttrOpen(Array(5).fill(false));
          }
        }
      }
      return updatedData;
    });
  };

  const handleNormalAttributeChange = (index: number, field: 'attributeId' | 'value') => (val: string) => {
    setFormData(prevData => {
      const updatedAttributes = [...prevData.normalAttributes];
      if (updatedAttributes[index]) {
        if (field === 'attributeId') {
          updatedAttributes[index].attributeId = val;
        } else {
          updatedAttributes[index].value = val;
        }
      }
      return { ...prevData, normalAttributes: updatedAttributes };
    });
  };

  const handleIconicAttributeChange = (index: number, field: 'attributeId' | 'value') => (val: string) => {
    setFormData(prevData => {
      const updatedIconicAttributes = [...prevData.iconicAttributes];
      if (updatedIconicAttributes[index]) {
        if (field === 'attributeId') {
          updatedIconicAttributes[index].attributeId = val;
        } else {
          updatedIconicAttributes[index].value = val;
        }
      }
      return { ...prevData, iconicAttributes: updatedIconicAttributes };
    });
  };

  const handleMaterialChange = (index: number, field: 'materialId' | 'quantity') => (val: string | number) => {
    setFormData(prevData => {
      const updatedMaterials = [...prevData.materials];
      if (updatedMaterials[index]) {
        if (field === 'materialId') {
          updatedMaterials[index].materialId = val as string;
        } else {
          updatedMaterials[index].quantity = parseInt(val as string, 10) || 0;
        }
      }
      return { ...prevData, materials: updatedMaterials };
    });
  };

  const addNormalAttribute = () => {
    setFormData(prevData => ({
      ...prevData,
      normalAttributes: [...prevData.normalAttributes, { attributeId: '', value: '' }],
    }));
    setNormalAttrOpen(prev => [...prev, false]);
  };

  const removeNormalAttribute = (index: number) => {
    setFormData(prevData => ({
      ...prevData,
      normalAttributes: prevData.normalAttributes.filter((_, i) => i !== index),
    }));
    setNormalAttrOpen(prev => prev.filter((_, i) => i !== index));
  };

  const addMaterial = () => {
    setFormData(prevData => ({
      ...prevData,
      materials: [...prevData.materials, { materialId: '', quantity: 1 }],
    }));
    setMaterialOpen(prev => [...prev, false]);
  };

  const removeMaterial = (index: number) => {
    setFormData(prevData => ({
      ...prevData,
      materials: prevData.materials.filter((_, i) => i !== index),
    }));
    setMaterialOpen(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewAttribute = async () => {
    setAddingAttribute(true);
    try {
      const isIconicForNewAttribute = currentComboboxContext?.type === 'iconicAttribute';

      const response = await fetch('/api/equipment/attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAttributeName,
          description: newAttributeDescription,
          isIconic: isIconicForNewAttribute,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newAttribute: Attribute = result.attribute;

        setMessage(`Attribute '${newAttribute.name}' added successfully!`);
        setIsError(false);
        setNewAttributeName('');
        setNewAttributeDescription('');
        setShowAddAttributeDialog(false);
        await fetchAttributes();

        if (currentComboboxContext && (currentComboboxContext.type === 'normalAttribute' || currentComboboxContext.type === 'iconicAttribute')) {
          const { type, index } = currentComboboxContext;
          if (type === 'normalAttribute') {
            handleNormalAttributeChange(index, 'attributeId')(newAttribute.id);
            setNormalAttrOpen(prev => {
              const newStates = [...prev];
              newStates[index] = false;
              return newStates;
            });
          } else if (type === 'iconicAttribute') {
            handleIconicAttributeChange(index, 'attributeId')(newAttribute.id);
            setIconicAttrOpen(prev => {
              const newStates = [...prev];
              newStates[index] = false;
              return newStates;
            });
          }
        }
        setCurrentComboboxContext(null);
      } else {
        const errorData = await response.json();
        setMessage(`Failed to add attribute: ${errorData.error || 'Unknown error'}`);
        setIsError(true);
      }
    } catch (error: any) {
      console.error('Error adding new attribute:', error);
      setMessage(`An unexpected error occurred while adding attribute: ${error.message || 'Please check console for details.'}`);
      setIsError(true);
    } finally {
      setAddingAttribute(false);
    }
  };

  const handleAddNewMaterial = async () => {
    setAddingMaterial(true);
    try {
      const response = await fetch('/api/equipment/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newMaterialName,
          description: newMaterialDescription,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newMaterial: Material = result.material;

        setMessage(`Material '${newMaterial.name}' added successfully!`);
        setIsError(false);
        setNewMaterialName('');
        setNewMaterialDescription('');
        setShowAddMaterialDialog(false);
        await fetchMaterials();

        if (currentComboboxContext && currentComboboxContext.type === 'material') {
          const { index } = currentComboboxContext;
          handleMaterialChange(index, 'materialId')(newMaterial.id);
          setMaterialOpen(prev => {
            const newStates = [...prev];
            newStates[index] = false;
            return newStates;
          });
        }
        setCurrentComboboxContext(null);
      } else {
        const errorData = await response.json();
        setMessage(`Failed to add material: ${errorData.error || 'Unknown error'}`);
        setIsError(true);
      }
    } catch (error: any) {
      console.error('Error adding new material:', error);
      setMessage(`An unexpected error occurred while adding material: ${error.message || 'Please check console for details.'}`);
      setIsError(true);
    } finally {
      setAddingMaterial(false);
    }
  };

  /**
   * Handles the manual form submission for a single equipment item.
   * @param e The form submission event.
   */
  const handleManualFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      const response = await fetch('/api/equipment/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage('Equipment added successfully!');
        // Reset form data after successful submission
        setFormData({
          name: '',
          slot: Slot.HEAD,
          rarity: Rarity.COMMON,
          src: '',
          alt: '',
          normalAttributes: [],
          iconicAttributes: Array.from({ length: 5 }, (_, i) => ({
            attributeId: '',
            value: '',
            tier: i + 1,
          })),
          materials: [],
        });
        setNormalAttrOpen([]);
        setIconicAttrOpen(Array(5).fill(false));
        setMaterialOpen([]);
      } else {
        const errorData: { error?: string } = await response.json();
        setMessage(`Failed to add equipment: ${errorData.error || 'Unknown error'}`);
        setIsError(true);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setMessage(`An unexpected error occurred: ${error.message || 'Please check console for details.'}`);
      setIsError(true);
    }
  };

  /**
   * Handles the change event for the JSON file input.
   * @param e The change event from the file input.
   */
  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
      setMessage(''); // Clear any previous messages
      setIsError(false);
    } else {
      setUploadedFile(null);
    }
  };

  /**
   * Handles the submission of the JSON file containing multiple equipment items.
   * Reads the file, parses JSON, and submits each item individually.
   */
  const handleJsonUploadSubmit = async () => {
    if (!uploadedFile) {
      setMessage('Please select a JSON file to upload.');
      setIsError(true);
      return;
    }

    setIsUploadingJson(true);
    setMessage('Uploading equipment from JSON...');
    setIsError(false);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error("Failed to read file content.");
        }
        const jsonContent: EquipmentFormData[] = JSON.parse(event.target.result as string);

        if (!Array.isArray(jsonContent)) {
          throw new Error('JSON content must be an array of equipment objects.');
        }

        let successCount = 0;
        let failureCount = 0;
        const failedItems: string[] = [];

        for (const [index, item] of jsonContent.entries()) {
          try {
            // Basic validation to ensure item conforms to EquipmentFormData shape
            if (!item.name || !item.slot || !item.rarity) {
              throw new Error(`Item at index ${index} is missing required fields.`);
            }

            const response = await fetch('/api/equipment/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(item),
            });

            if (response.ok) {
              successCount++;
            } else {
              failureCount++;
              const errorData = await response.json();
              failedItems.push(`Item '${item.name || `at index ${index}`}' failed: ${errorData.error || 'Unknown error'}`);
            }
          } catch (itemError: any) {
            failureCount++;
            failedItems.push(`Item '${item.name || `at index ${index}`}' processing error: ${itemError.message || 'Unknown error'}`);
          }
        }

        if (successCount > 0 && failureCount === 0) {
          setMessage(`Successfully added ${successCount} equipment items from JSON.`);
          setIsError(false);
          setUploadedFile(null); // Clear the file input
        } else if (successCount > 0 && failureCount > 0) {
          setMessage(`Added ${successCount} items, but ${failureCount} failed. Details: ${failedItems.join('; ')}`);
          setIsError(true);
          setUploadedFile(null); // Clear the file input
        } else {
          setMessage(`Failed to add any equipment items from JSON. Details: ${failedItems.join('; ')}`);
          setIsError(true);
          setUploadedFile(null); // Clear the file input
        }

      } catch (parseError: any) {
        setMessage(`Error processing JSON file: ${parseError.message || 'Invalid JSON format.'}`);
        setIsError(true);
      } finally {
        setIsUploadingJson(false);
      }
    };

    reader.onerror = () => {
      setMessage('Error reading file.');
      setIsError(true);
      setIsUploadingJson(false);
    };

    reader.readAsText(uploadedFile);
  };

  // Function to reset form and mode when returning to choice screen
  const resetFormAndMode = () => {
    setUiMode('choose');
    setMessage('');
    setIsError(false);
    setFormData({
      name: '',
      slot: Slot.HEAD,
      rarity: Rarity.COMMON,
      src: '',
      alt: '',
      normalAttributes: [],
      iconicAttributes: Array.from({ length: 5 }, (_, i) => ({
        attributeId: '',
        value: '',
        tier: i + 1,
      })),
      materials: [],
    });
    setNormalAttrOpen([]);
    setIconicAttrOpen(Array(5).fill(false));
    setMaterialOpen([]);
    setNewAttributeName('');
    setNewAttributeDescription('');
    setNewMaterialName('');
    setNewMaterialDescription('');
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center font-sans">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800 text-center">
            Add New Equipment
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Choose how you want to add equipment to the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Display status messages (success/error) */}
          <StatusMessage message={message} isError={isError} />

          {uiMode === 'choose' && (
            <div className="flex flex-col space-y-4 items-center justify-center py-8">
              <Button onClick={() => setUiMode('manual')} className="w-64">
                Manual Entry Form
              </Button>
              <Button onClick={() => setUiMode('json')} className="w-64" variant="outline">
                Upload JSON File
              </Button>
            </div>
          )}

          {uiMode === 'manual' && (
            <form onSubmit={handleManualFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Equipment Details Section */}
                <EquipmentDetailsForm
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleSelectChange={handleSelectChange}
                />

                {/* Attributes Column */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Attributes</h3>

                  {/* Normal Attributes Section */}
                  <NormalAttributesSection
                    normalAttributes={formData.normalAttributes}
                    availableAttributes={availableAttributes}
                    handleNormalAttributeChange={handleNormalAttributeChange}
                    addNormalAttribute={addNormalAttribute}
                    removeNormalAttribute={removeNormalAttribute}
                    normalAttrOpen={normalAttrOpen}
                    setNormalAttrOpen={setNormalAttrOpen}
                    setShowAddAttributeDialog={setShowAddAttributeDialog}
                    setCurrentComboboxContext={setCurrentComboboxContext}
                  />

                  {/* Conditional Rendering for Iconic Attributes Section */}
                  {formData.rarity === Rarity.LEGENDARY && (
                    <IconicAttributesSection
                      iconicAttributes={formData.iconicAttributes}
                      availableAttributes={availableAttributes}
                      handleIconicAttributeChange={handleIconicAttributeChange}
                      iconicAttrOpen={iconicAttrOpen}
                      setIconicAttrOpen={setIconicAttrOpen}
                      setShowAddAttributeDialog={setShowAddAttributeDialog}
                      setCurrentComboboxContext={setCurrentComboboxContext}
                    />
                  )}
                </div>
              </div>

              {/* Materials Section (moved to bottom, full width) */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold border-b pb-2">Materials</h3>
                <MaterialsSection
                  materials={formData.materials}
                  availableMaterials={availableMaterials}
                  handleMaterialChange={handleMaterialChange}
                  addMaterial={addMaterial}
                  removeMaterial={removeMaterial}
                  materialOpen={materialOpen}
                  setMaterialOpen={setMaterialOpen}
                  setShowAddMaterialDialog={setShowAddMaterialDialog}
                  setCurrentComboboxContext={setCurrentComboboxContext}
                />
              </div>

              {/* Submit Button for Manual Form */}
              <Button type="submit" className="w-full">
                Add Equipment
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={resetFormAndMode}>
                Back to Options
              </Button>
            </form>
          )}

          {uiMode === 'json' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Upload a JSON file containing an array of equipment objects. Each object should conform to the structure of a single equipment entry.
              </p>
              <div className="flex items-center space-x-2">
                <Input type="file" accept=".json" onChange={handleJsonFileChange} className="flex-grow" />
                <Button onClick={handleJsonUploadSubmit} disabled={!uploadedFile || isUploadingJson}>
                  {isUploadingJson ? 'Uploading...' : 'Upload & Add'}
                </Button>
              </div>
              <Button type="button" variant="ghost" className="w-full" onClick={resetFormAndMode}>
                Back to Options
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Attribute Dialog */}
      <AddAttributeDialog
        open={showAddAttributeDialog}
        onOpenChange={setShowAddAttributeDialog}
        name={newAttributeName}
        onNameChange={(e) => setNewAttributeName(e.target.value)}
        description={newAttributeDescription}
        onDescriptionChange={(e) => setNewAttributeDescription(e.target.value)}
        onAdd={handleAddNewAttribute}
        isAdding={addingAttribute}
      />

      {/* Add New Material Dialog */}
      <AddMaterialDialog
        open={showAddMaterialDialog}
        onOpenChange={setShowAddMaterialDialog}
        name={newMaterialName}
        onNameChange={(e) => setNewMaterialName(e.target.value)}
        description={newMaterialDescription}
        onDescriptionChange={(e) => setNewMaterialDescription(e.target.value)}
        onAdd={handleAddNewMaterial}
        isAdding={addingMaterial}
      />
    </div>
  );
};

export default AddEquipmentPage;