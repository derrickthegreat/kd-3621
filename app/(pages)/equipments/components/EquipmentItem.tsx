'use client'

import Image from "next/image";
import { Equipment, Slot } from "../utils/types";
import { rarityColors } from "../utils/rarityColors";

type EquipmentItemProps = {
    equipment: Equipment;
    selectedGear: Partial<Record<Slot, Equipment>>;
    onSelect: (slotKey: Slot, equipment: Equipment) => void;
};

export default function EquipmentItem({ equipment, selectedGear, onSelect }: EquipmentItemProps) {
    const rarityKey = equipment.rarity.trim().charAt(0).toUpperCase() + equipment.rarity.trim().slice(1).toLowerCase();
    const slotKey = equipment.slot === "Accessory"
        ? (selectedGear.Accessory1 ? "Accessory2" : "Accessory1")
        : (equipment.slot as Slot);

    const tooltip = `${rarityKey} ${equipment.name}\n` +
        equipment.attributes.map(attr => `${attr.stat}: +${attr.value}%`).join("\n");

    return (
        <div
            key={equipment.name}
            className="relative cursor-pointer pb-2.5 group"
            onClick={() => onSelect(slotKey, equipment)}
        >
            <div
                className="w-12 h-12 md:w-[42px] md:h-[42px] lg:w-[50px] lg:h-[50px] flex justify-center items-center hover:cursor-pointer rounded-md border-4"
                style={{
                    borderColor: rarityColors[rarityKey]?.border,
                    background: rarityColors[rarityKey]?.background,
                }}
                title={tooltip}
            >
                <Image
                    src={equipment.src}
                    alt={equipment.alt}
                    width={40}
                    height={40}
                    className="object-cover"
                />
            </div>
        </div>
    );
}
