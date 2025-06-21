'use client'

import { formatNumber } from "@/app/utils/format";
import Image from "next/image";
import { useEffect, useState } from "react";
import SlotIcon from "./components/SlotIcon";
import { rarityColors } from "./utils/rarityColors";
import GearSlots from "./components/GearSlots";
import { Equipment, Slot } from "./utils/types";
import TotalStats from "./components/TotalStats";
import TotalMaterials from "./components/TotalMaterials";
import EquipmentGrid from "./components/EquipmentGrid";

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
                    : `${mat.material.toLowerCase().replace(/\s+/g, "_")}_${rarity}`;
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
            <GearSlots selectedGear={selectedGear} />

            {/* CENTER: Stats + Materials (1/4 stacked) */}
            <div className="w-full lg:w-1/4 flex flex-col gap-6 mb-4 lg:mb-0 justify-center">
                {/* Total Stats */}
                <TotalStats stats={totalStats} />

                {/* Total Materials */}
                <TotalMaterials materials={totalMats} />
            </div>

            {/* RIGHT: Equipments (2/4) */}
            <EquipmentGrid
                equipments={equipments}
                selectedGear={selectedGear}
                selectedRarity={selectedRarity}
                selectedAttribute={selectedAttribute}
                setSelectedGear={setSelectedGear}
                setSelectedRarity={setSelectedRarity}
                setSelectedAttribute={setSelectedAttribute}
                resetSlots={resetSlots}
            />
        </div>
    );

}
