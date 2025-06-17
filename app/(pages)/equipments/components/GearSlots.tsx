'use client';

import SlotIcon from "./SlotIcon";
import type { Equipment, Slot } from "../utils/types";

interface GearSlotsProps {
    selectedGear: Partial<Record<Slot, Equipment>>;
}

export default function GearSlots({ selectedGear }: GearSlotsProps) {
    return (
        <aside className="w-full lg:w-1/4 top-6 flex flex-col items-center justify-center gap-0">
            <div className="flex flex-col items-center justify-center gap-[2rem]">
                <SlotIcon icon={selectedGear.Helmet?.src || "/icons/slot_icons/helmet.png"} rarity={selectedGear.Helmet?.rarity} />
                <SlotIcon icon={selectedGear.Chest?.src || "/icons/slot_icons/chest.png"} rarity={selectedGear.Chest?.rarity} />
            </div>
            <div className="flex gap-[2rem]">
                <SlotIcon icon={selectedGear.Weapon?.src || "/icons/slot_icons/weapon.png"} rarity={selectedGear.Weapon?.rarity} />
                <SlotIcon icon={selectedGear.Gloves?.src || "/icons/slot_icons/gloves.png"} rarity={selectedGear.Gloves?.rarity} />
            </div>
            <SlotIcon icon={selectedGear.Legs?.src || "/icons/slot_icons/pants.png"} rarity={selectedGear.Legs?.rarity} />
            <div className="flex gap-[2rem]">
                <SlotIcon icon={selectedGear.Accessory1?.src || "/icons/slot_icons/accessory1.png"} rarity={selectedGear.Accessory1?.rarity} />
                <SlotIcon icon={selectedGear.Accessory2?.src || "/icons/slot_icons/accessory2.png"} rarity={selectedGear.Accessory2?.rarity} />
            </div>
            <SlotIcon icon={selectedGear.Boots?.src || "/icons/slot_icons/boots.png"} rarity={selectedGear.Boots?.rarity} />
        </aside>
    );
}
