'use client';

import Image from 'next/image';
import { rarityColors } from '../utils/rarityColors'

type SlotIconProps = {
    icon: string;
    rarity?: string;
};

export default function SlotIcon({ icon, rarity }: SlotIconProps) {
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
        </div>
    );
}
