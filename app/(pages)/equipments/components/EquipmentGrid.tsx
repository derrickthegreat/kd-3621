'use client'

import { Equipment, Slot } from "../utils/types";
import EquipmentItem from "./EquipmentItem";
import FilterBar from "./FilterBar";

type Props = {
    equipments: Equipment[];
    selectedGear: Partial<Record<Slot, Equipment>>;
    selectedRarity: string | null;
    selectedAttribute: string | null;
    setSelectedGear: (gear: Partial<Record<Slot, Equipment>>) => void;
    setSelectedRarity: (rarity: string | null) => void;
    setSelectedAttribute: (attr: string | null) => void;
    resetSlots: () => void;
};

export default function EquipmentGrid({
    equipments,
    selectedGear,
    selectedRarity,
    selectedAttribute,
    setSelectedGear,
    setSelectedRarity,
    setSelectedAttribute,
    resetSlots
}: Props) {
    const filtered = equipments
        .filter(eq => !selectedRarity || eq.rarity === selectedRarity)
        .filter(eq => !selectedAttribute || eq.attributes.some(attr => attr.stat === selectedAttribute));

    const attributeOptions = [
        ...new Set(
            equipments.flatMap(eq =>
                eq.attributes.map(attr => attr.stat).filter(stat => stat.trim().split(/\s+/).length <= 4)
            )
        )
    ];

    const handleSelect = (slot: Slot, eq: Equipment) => {
        setSelectedGear({ ...selectedGear, [slot]: eq });
    };

    return (
        <section className="w-full lg:w-2/4 flex flex-col">
            <FilterBar
                selectedRarity={selectedRarity}
                selectedAttribute={selectedAttribute}
                setSelectedRarity={setSelectedRarity}
                setSelectedAttribute={setSelectedAttribute}
                resetSlots={resetSlots}
                attributeOptions={attributeOptions}
            />

            <div className="overflow-y-auto max-h-[70vh] pt-4 scrollbar-custom">
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-[0rem]">
                    {filtered.map(eq => (
                        <EquipmentItem
                            key={eq.name}
                            equipment={eq}
                            selectedGear={selectedGear}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
