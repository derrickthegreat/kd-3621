// @/src/components/DiscordButton.tsx
'use client'

import Image from 'next/image'

export default function DiscordButton() {
    return (
        <a
            href="https://discord.gg/GHDPSUmb"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-40 bg-white rounded-full h-14 flex flex-row-reverse items-center shadow-lg overflow-hidden transition-all duration-500 group hover:w-56 w-14"
            aria-label="Join us on Discord"
        >
            <Image
                src="/icons/discord-icon.svg"
                alt="Discord logo"
                width={28}
                height={28}
                className="object-contain shrink-0 mr-[14px]"
            />
            <span className="text-md font-medium text-[#5865F2] whitespace-nowrap pr-4 opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-[200px] transition-all duration-500">
                Join 3621&apos;s Discord
            </span>
        </a>
    )
}
