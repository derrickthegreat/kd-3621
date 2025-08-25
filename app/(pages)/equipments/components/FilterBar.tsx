'use client'

type FilterBarProps = {
    selectedRarity: string | null;
    selectedAttribute: string | null;
    setSelectedRarity: (rarity: string | null) => void;
    setSelectedAttribute: (attr: string | null) => void;
    resetSlots: () => void;
    attributeOptions: string[];
};

export default function FilterBar({
    selectedRarity,
    selectedAttribute,
    setSelectedRarity,
    setSelectedAttribute,
    resetSlots,
    attributeOptions
}: FilterBarProps) {
    return (
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
                    {attributeOptions.map(stat => (
                        <option key={stat} value={stat}>{stat}</option>
                    ))}
                </select>
            </div>

            <button
                onClick={resetSlots}
                className="bg-red-600 hover:bg-red-900 text-white text-sm px-3 py-1 rounded cursor-pointer transition-colors duration-200"
            >
                Reset Slots
            </button>
        </div>
    );
}
