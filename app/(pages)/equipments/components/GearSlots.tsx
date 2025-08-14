'use client';

import SlotIcon from "./SlotIcon";
import type { Equipment, Slot } from "../utils/types";

interface GearSlotsProps {
    selectedGear: Partial<Record<Slot, Equipment>>;
    setSelectedGear: (gear: Partial<Record<Slot, Equipment>>) => void;
}

export default function GearSlots({ selectedGear, setSelectedGear }: GearSlotsProps) {
    return (
        <aside className="w-full lg:w-1/4 top-6 flex flex-col items-center justify-center gap-0">
            <div className="flex flex-col items-center justify-center gap-[2rem]">
                <SlotIcon icon={selectedGear.Helmet?.src || "/icons/slot_icons/helmet.png"}
                    rarity={selectedGear.Helmet?.rarity}
                    onRemove={selectedGear.Helmet ? () => {
                        const newGear = { ...selectedGear };
                        delete newGear.Helmet;
                        setSelectedGear(newGear);
                    } : undefined}
                />
                <SlotIcon icon={selectedGear.Chest?.src || "/icons/slot_icons/chest.png"}
                    rarity={selectedGear.Chest?.rarity}
                    onRemove={selectedGear.Chest ? () => {
                        const newGear = { ...selectedGear };
                        delete newGear.Chest;
                        setSelectedGear(newGear);
                    } : undefined}
                />
            </div>
            <div className="flex gap-[2rem]">
                <SlotIcon icon={selectedGear.Weapon?.src || "/icons/slot_icons/weapon.png"}
                    rarity={selectedGear.Weapon?.rarity}
                    onRemove={selectedGear.Weapon ? () => {
                        const newGear = { ...selectedGear };
                        delete newGear.Weapon;
                        setSelectedGear(newGear);
                    } : undefined}
                />
                <SlotIcon icon={selectedGear.Gloves?.src || "/icons/slot_icons/gloves.png"}
                    rarity={selectedGear.Gloves?.rarity}
                    onRemove={selectedGear.Gloves ? () => {
                        const newGear = { ...selectedGear };
                        delete newGear.Gloves;
                        setSelectedGear(newGear);
                    } : undefined}
                />
            </div>
            <SlotIcon icon={selectedGear.Legs?.src || "/icons/slot_icons/pants.png"}
                rarity={selectedGear.Legs?.rarity}
                onRemove={selectedGear.Legs ? () => {
                    const newGear = { ...selectedGear };
                    delete newGear.Legs;
                    setSelectedGear(newGear);
                } : undefined}
            />
            <div className="flex gap-[2rem]">
                <SlotIcon icon={selectedGear.Accessory1?.src || "/icons/slot_icons/accessory1.png"}
                    rarity={selectedGear.Accessory1?.rarity}
                    onRemove={selectedGear.Accessory1 ? () => {
                        const newGear = { ...selectedGear };
                        delete newGear.Accessory1;
                        setSelectedGear(newGear);
                    } : undefined}
                />
                <SlotIcon icon={selectedGear.Accessory2?.src || "/icons/slot_icons/accessory2.png"}
                    rarity={selectedGear.Accessory2?.rarity}
                    onRemove={selectedGear.Accessory2 ? () => {
                        const newGear = { ...selectedGear };
                        delete newGear.Accessory2;
                        setSelectedGear(newGear);
                    } : undefined}
                />
            </div>
            <SlotIcon icon={selectedGear.Boots?.src || "/icons/slot_icons/boots.png"}
                rarity={selectedGear.Boots?.rarity}
                onRemove={selectedGear.Boots ? () => {
                    const newGear = { ...selectedGear };
                    delete newGear.Boots;
                    setSelectedGear(newGear);
                } : undefined}
            />
        </aside>
    );
}
