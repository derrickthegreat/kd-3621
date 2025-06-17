'use client'

import { formatNumber } from "@/app/utils/format";
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

const rarityColors: Record<string, { border: string; background: string }> = {
    Legendary: {
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
    const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
    const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);

    const resetSlots = () => {
        setSelectedGear({});
    };


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

    const totalStats = selectedGear
        ? Object.values(selectedGear).flatMap(eq => eq?.attributes || [])
            .reduce((acc, cur) => {
                acc[cur.stat] = (acc[cur.stat] || 0) + cur.value;
                return acc;
            }, {} as Record<string, number>)
        : {};

    const rarityOrder = ["legendary", "epic", "elite", "advanced", "normal"];


    const totalMats = selectedGear
        ? Object.values(selectedGear).flatMap(eq => {
            if (!eq) return [];
            const rarity = eq.rarity.trim().toLowerCase();
            return eq.materials.map(mat => {
                const key = mat.material.toLowerCase() === 'gold'
                    ? 'gold'
                    : `${mat.material.toLowerCase()}_${rarity}`;
                return { key, value: mat.value };
            });
        }).reduce((acc, cur) => {
            acc[cur.key] = (acc[cur.key] || 0) + cur.value;
            return acc;
        }, {} as Record<string, number>)
        : {};



    return (
        <div className="p-6 text-white flex flex-col lg:flex-row">
            {/* LEFT: Slots (1/4) */}
            <aside className="w-full lg:w-1/4 sticky top-6 flex flex-col items-center justify-center gap-0">
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

            {/* CENTER: Stats + Materials (1/4 stacked) */}
            <div className="w-full lg:w-1/4 flex flex-col gap-6 justify-center">
                {/* Total Stats */}
                <div>
                    <h3 className="text-xl font-semibold mb-2">Total Stats</h3>
                    {Object.keys(totalStats).length === 0 ? (
                        <p className="text-sm text-blue-400 italic">No stats available</p>
                    ) : (
                        <ul className="text-sm text-blue-300 space-y-1">
                            {Object.entries(totalStats).map(([stat, val]) => (
                                <li key={stat}>{stat}: +{val}%</li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Total Materials */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Total Material Cost</h3>
                    {Object.keys(totalMats).length === 0 ? (
                        <p className="text-sm text-blue-400 italic">No materials required</p>
                    ) : (
                        <ul className="text-sm text-blue-300 space-y-1">
                            {Object.entries(totalMats)
                                .sort(([a], [b]) => {
                                    if (a === "gold") return 1;
                                    if (b === "gold") return -1;
                                    const ra = a.split("_")[1];
                                    const rb = b.split("_")[1];
                                    const ia = rarityOrder.indexOf(ra);
                                    const ib = rarityOrder.indexOf(rb);
                                    if (ia === -1 && ib === -1) return 0;
                                    if (ia === -1) return 1;
                                    if (ib === -1) return -1;
                                    return ia - ib;
                                })
                                .map(([matKey, val]) => {
                                    const isGold = matKey === 'gold';
                                    const [name, rarity] = isGold ? ['Gold'] : matKey.split('_');
                                    const capitalized = isGold
                                        ? 'Gold'
                                        : `${rarity.charAt(0).toUpperCase()}${rarity.slice(1)} ${name.charAt(0).toUpperCase()}${name.slice(1)}`;
                                    return (
                                        <li key={matKey} className="flex items-center gap-2">
                                            <Image
                                                src={`/icons/materials/${matKey}.png`}
                                                alt={matKey}
                                                width={24}
                                                height={24}
                                            />
                                            <span>{capitalized}</span><span>x{formatNumber(val)}</span>
                                        </li>
                                    );
                                })}
                        </ul>
                    )}
                </div>
            </div>


            {/* RIGHT: Equipments (2/4) */}
            <section className="w-full lg:w-2/4 flex flex-col">
                {/* Filtros e Reset */}
                <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-2">
                        <select
                            className="bg-gray-800 border border-gray-600 text-sm px-2 py-1 rounded"
                            value={selectedRarity || ""}
                            onChange={(e) => setSelectedRarity(e.target.value || null)}
                        >
                            <option value="">All Rarities</option>
                            {["Legendary", "Epic", "Elite", "Advanced", "Normal"].map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>

                        <select
                            className="bg-gray-800 border border-gray-600 text-sm px-2 py-1 rounded"
                            value={selectedAttribute || ""}
                            onChange={(e) => setSelectedAttribute(e.target.value || null)}
                        >
                            <option value="">All Attributes</option>
                            {[...new Set(
                                equipments.flatMap(eq =>
                                    eq.attributes
                                        .map(attr => attr.stat)
                                        .filter(stat => stat.trim().split(/\s+/).length <= 4)
                                )
                            )
                            ].map(stat => (
                                <option key={stat} value={stat}>{stat}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={resetSlots}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                    >
                        Reset Slots
                    </button>
                </div>


                <div className="overflow-y-auto max-h-[70vh] pt-4">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-[0rem]">
                        {equipments
                            .filter(eq => !selectedRarity || eq.rarity === selectedRarity)
                            .filter(eq => !selectedAttribute || eq.attributes.some(attr => attr.stat === selectedAttribute))
                            .map((eq) => {
                                const rarityKey = eq.rarity.trim().charAt(0).toUpperCase() + eq.rarity.trim().slice(1).toLowerCase();
                                const slotKey = eq.slot === "Accessory"
                                    ? (selectedGear.Accessory1 ? "Accessory2" : "Accessory1")
                                    : (eq.slot as Slot);
                                const tooltip = `${rarityKey} ${eq.name}\n` + eq.attributes.map(attr => `${attr.stat}: +${attr.value}%`).join("\n");
                                return (
                                    <div
                                        key={eq.name}
                                        className="relative cursor-pointer pb-2.5 group"
                                        onClick={() => setSelectedGear(prev => ({ ...prev, [slotKey]: eq }))}
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
                                                src={eq.src}
                                                alt={eq.alt}
                                                width={40}
                                                height={40}
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </section>
        </div>
    );

}

function SlotIcon({ icon, rarity }: { icon: string; rarity?: string }) {
    const background = rarity ? rarityColors[rarity]?.background : "radial-gradient(circle, rgb(0, 0, 0) 30%, rgba(128, 128, 128, 0.25) 100%)";

    return (
        <div
            className="relative transform rotate-45 w-[60px] h-[60px] lg:w-[4.5rem] lg:h-[4.5rem] flex justify-center items-center border-4 border-transparent hover:cursor-pointer rounded-md"
            style={{
                borderColor: "rgba(128, 128, 128, 0.25)",
                background
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
