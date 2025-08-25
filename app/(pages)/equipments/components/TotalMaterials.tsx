'use client'

import Image from "next/image";
import { formatNumber } from "@/app/utils/format";

type Props = {
    materials: Record<string, number>;
};

const rarityOrder = ["legendary", "epic", "elite", "advanced", "normal"];

export default function TotalMaterials({ materials }: Props) {
    return (
        <div>
            <h3 className="text-lg font-semibold mb-2">Total Material Cost</h3>
            {Object.keys(materials).length === 0 ? (
                <p className="text-sm text-blue-400 italic">No materials required</p>
            ) : (
                <ul className="text-sm text-blue-300 space-y-1">
                    {Object.entries(materials)
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
                            const isGold = matKey === "gold";
                            const [name, rarity] = isGold ? ["Gold"] : matKey.split("_");
                            const label = isGold
                                ? "Gold"
                                : `${rarity.charAt(0).toUpperCase()}${rarity.slice(1)} ${name.charAt(0).toUpperCase()}${name.slice(1)}`;

                            return (
                                <li key={matKey} className="flex items-center gap-2">
                                    <Image
                                        src={`/icons/materials/${matKey}.png`}
                                        alt={matKey}
                                        width={24}
                                        height={24}
                                    />
                                    <span>{label}</span>
                                    <span>x{formatNumber(val)}</span>
                                </li>
                            );
                        })}
                </ul>
            )}
        </div>
    );
}
