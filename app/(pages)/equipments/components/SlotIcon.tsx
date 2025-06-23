'use client';

import Image from 'next/image';
import { rarityColors } from '../utils/rarityColors'

type SlotIconProps = {
    icon: string;
    rarity?: string;
    onRemove?: () => void;
};

export default function SlotIcon({ icon, rarity, onRemove }: SlotIconProps) {
    const background = rarity
        ? rarityColors[rarity]?.background
        : 'radial-gradient(circle, rgb(0, 0, 0) 30%, rgba(128, 128, 128, 0.25) 100%)';

    return (
        <div
            className="relative transform rotate-45 w-[60px] h-[60px] lg:w-[4.5rem] lg:h-[4.5rem] flex justify-center items-center border-4 border-transparent hover:cursor-pointer rounded-md"
            style={{
                borderColor: 'rgba(128, 128, 128, 0.25)',
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

            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-0 right-0 -rotate-45 bg-black/70 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    title="Remove equipment"
                >
                    ×
                </button>
            )}
        </div>
    );
}
