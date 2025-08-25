'use client'

import Image from 'next/image'
import Link from 'next/link'

type HomeCardProps = {
    href: string
    icon: string
    label: string
}

export default function HomeCard({ href, icon, label }: HomeCardProps) {
    return (
        <Link
            href={href}
            className="bg-gray-800/80 hover:bg-orange-500 transition-colors border border-gray-700 rounded-lg px-6 py-4 flex flex-col items-center justify-center text-white shadow-lg hover:scale-105 transform transition duration-200"
        >
            <Image src={icon} alt={label} width={40} height={40} className="mb-2" />
            <span className="text-lg font-medium">{label}</span>
        </Link>
    )
}
