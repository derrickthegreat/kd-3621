'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import Image from 'next/image';

// Navigation links displayed in the navbar
const navLinks = [
    { href: '/players', label: 'Players' },
    { href: '/alliances', label: 'Alliances' },
    { href: '/calendar', label: 'Calendar' },
];

export default function Navbar() {
    const pathname = usePathname(); // Get the current path
    const [isOpen, setIsOpen] = useState(false); // State to toggle mobile menu

    return (
        <nav className="bg-gray-900 border-b border-gray-800 text-white">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Logo / Site title */}
                <Link href="/" className="flex justify-between items-center text-xl font-bold text-orange-400">
                    Kingdom 3621
                </Link>

                {/* Hamburger menu button for small screens */}
                <button
                    className="sm:hidden text-gray-300 hover:text-white focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {isOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                {/* Desktop navigation links */}
                <div className="hidden sm:flex gap-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={clsx(
                                'text-sm px-3 py-1 rounded transition-colors',
                                pathname === link.href
                                    ? 'bg-orange-500 text-white'
                                    : 'hover:bg-gray-800 text-gray-300'
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Mobile dropdown menu */}
            {isOpen && (
                <div className="sm:hidden px-4 pb-4 flex flex-col gap-2">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={clsx(
                                'block text-sm px-3 py-2 rounded transition-colors',
                                pathname === link.href
                                    ? 'bg-orange-500 text-white'
                                    : 'hover:bg-gray-800 text-gray-300'
                            )}
                            onClick={() => setIsOpen(false)} // Close menu on click
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
}
