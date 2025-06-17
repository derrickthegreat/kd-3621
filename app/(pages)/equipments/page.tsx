'use client'

import Image from "next/image";
import { useEffect, useState } from "react";

export type Slot = "Helmet" | "Chest" | "Weapon" | "Gloves" | "Legs" | "Boots" | "Accessory1" | "Accessory2";

export type Equipment = {
    name: string;
    slot: string;
    rarity: string;
    src: string;
    type: string;
    alt: string;
    attributes: { stat: string; value: number }[];
    materials: { material: string; value: number }[];
};

const slotOrder: { key: Slot; icon: string }[] = [
    { key: "Helmet", icon: "/icons/slot_icons/helmet.png" },
    { key: "Chest", icon: "/icons/slot_icons/chest.png" },
    { key: "Weapon", icon: "/icons/slot_icons/weapon.png" },
    { key: "Gloves", icon: "/icons/slot_icons/gloves.png" },
    { key: "Legs", icon: "/icons/slot_icons/pants.png" },
    { key: "Accessory1", icon: "/icons/slot_icons/accessory1.png" },
    { key: "Accessory2", icon: "/icons/slot_icons/accessory2.png" },
    { key: "Boots", icon: "/icons/slot_icons/boots.png" },
];

const rarityColors: Record<string, { border: string; background: string }> = {
    Legend: {
        border: "rgb(203, 84, 0)",
        background: "radial-gradient(circle, rgb(247, 152, 0) 0%, rgb(203, 84, 0) 100%)"
    },
    Epic: {
        border: "rgb(109, 14, 138)",
        background: "radial-gradient(circle, rgb(212, 108, 238) 0%, rgb(109, 14, 138) 100%)"
    },
    Elite: {
        border: "rgb(0, 108, 149)",
        background: "radial-gradient(circle, rgb(0, 190, 230) 0%, rgb(0, 108, 149) 100%)"
    },
    Advanced: {
        border: "rgb(5, 124, 5)",
        background: "radial-gradient(circle, rgb(0, 212, 41) 0%, rgb(5, 124, 5) 100%)"
    },
    Normal: {
        border: "rgb(79, 82, 82)",
        background: "radial-gradient(circle, rgb(117, 117, 117) 0%, rgb(79, 82, 82) 100%)"
    },
};

export default function EquipmentPage() {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [selectedGear, setSelectedGear] = useState<Partial<Record<Slot, Equipment>>>({});

    useEffect(() => {
        fetch("/data/equipments.json")
            .then((res) => res.json())
            .then(data => {
                const order = ["Legendary", "Epic", "Elite", "Advanced", "Normal"];
                const sorted = data.sort((a: Equipment, b: Equipment) => {
                    return order.indexOf(a.rarity.trim()) - order.indexOf(b.rarity.trim());
                });
                setEquipments(sorted);
            })
            .catch(console.error);
    }, []);

    return (
        <div className="p-6 text-white flex gap-8">
            <div className="w-1/3 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-[2rem]">
                    <SlotIcon icon={selectedGear.Helmet?.src || "/icons/slot_icons/helmet.png"} />
                    <SlotIcon icon={selectedGear.Chest?.src || "/icons/slot_icons/chest.png"} />
                </div>
                <div className="flex gap-[2rem]">
                    <SlotIcon icon={selectedGear.Weapon?.src || "/icons/slot_icons/weapon.png"} />
                    <SlotIcon icon={selectedGear.Gloves?.src || "/icons/slot_icons/gloves.png"} />
                </div>
                <SlotIcon icon={selectedGear.Legs?.src || "/icons/slot_icons/pants.png"} />
                <div className="flex gap-[2rem]">
                    <SlotIcon icon={selectedGear.Accessory1?.src || "/icons/slot_icons/accessory1.png"} />
                    <SlotIcon icon={selectedGear.Accessory2?.src || "/icons/slot_icons/accessory2.png"} />
                </div>
                <SlotIcon icon={selectedGear.Boots?.src || "/icons/slot_icons/boots.png"} />
            </div>

            <div className="w-2/3 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-7 md:grid-cols-10 lg:grid-cols-12 gap-x-[0.2rem] gap-y-[0.2rem]">
                    {equipments.map((eq) => {
                        const rarityKey = eq.rarity.trim().charAt(0).toUpperCase() + eq.rarity.trim().slice(1).toLowerCase();
                        return (
                            <div
                                key={eq.name}
                                className="relative cursor-pointer pb-2.5"
                                onClick={() => {
                                    const slotKey = eq.slot === "Accessory" ? (selectedGear.Accessory1 ? "Accessory2" : "Accessory1") : (eq.slot as Slot);
                                    setSelectedGear((prev) => ({ ...prev, [slotKey]: eq }));
                                }}
                            >
                                <div
                                    className="w-12 h-12 md:w-[52px] md:h-[52px] lg:w-[60px] lg:h-[60px] flex justify-center items-center hover:cursor-pointer rounded-md border-4"
                                    style={{
                                        borderColor: rarityColors[rarityKey]?.border,
                                        background: rarityColors[rarityKey]?.background,
                                    }}
                                >
                                    <Image
                                        src={eq.src}
                                        alt={eq.alt}
                                        width={40}
                                        height={40}
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SlotIcon({ icon }: { icon: string }) {
    return (
        <div
            className="relative transform rotate-45 w-[60px] h-[60px] lg:w-[4.5rem] lg:h-[4.5rem] flex justify-center items-center border-4 border-transparent hover:cursor-pointer rounded-md"
            style={{
                borderColor: "rgba(128, 128, 128, 0.25)",
                background: "radial-gradient(circle, rgb(0, 0, 0) 30%, rgba(128, 128, 128, 0.25) 100%)"
            }}
        >
            <Image
                src={icon}
                alt="slot"
                width={35}
                height={35}
                className="lg:w-12 lg:h-12 rotate-[-45deg] object-scale-down max-h-[4.5rem] max-w-[4.5rem]"
            />
        </div>
    );
}