"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { SignedIn, SignedOut, useUser, SignOutButton } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronsUpDown, LogOut, Settings, User, LayoutDashboard } from 'lucide-react';
import dynamic from 'next/dynamic';

const UserSettingsDialog = dynamic(() => import('@/app/components/UserSettingsDialog'), { ssr: false });

// Navigation links displayed in the navbar
const navLinks = [
    { href: '/players', label: 'Governors' },
    { href: '/alliances', label: 'Alliances' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/commanders', label: 'Commander' },
    { href: '/equipments', label: 'Equipments' },
    { href: '/builds', label: 'Builds' },
];

export default function Navbar() {
    const pathname = usePathname(); // Get the current path
    const [isOpen, setIsOpen] = useState(false); // State to toggle mobile menu
    const { user } = useUser();
    const [profile, setProfile] = useState<{ username?: string; displayName?: string; avatarUrl?: string; commanderAvatarId?: string; role?: string } | null>(null);
    const [commanderAvatarUrl, setCommanderAvatarUrl] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const clerkFallbackName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'User';
    const email = user?.primaryEmailAddress?.emailAddress || '';
    const clerkImageUrl = user?.imageUrl || '';

    useEffect(() => {
        // Fetch our user profile for displayName/username and commander avatar
        (async () => {
            try {
                const me = await fetch('/api/v1/users/me').then(r => r.ok ? r.json() : null);
                if (me?.profile) {
                    setProfile(me.profile);
                    if (me.profile.commanderAvatarId) {
                        // hydrate commander avatar icon
                        const cmd = await fetch('/api/v1/commander').then(r => r.json()).catch(() => []);
                        const picked = (cmd || []).find((c: any) => c.id === me.profile.commanderAvatarId);
                        setCommanderAvatarUrl(picked?.iconUrl || null);
                    }
                }
            } catch {}
        })();
    }, []);

    const displayName = profile?.displayName || clerkFallbackName;
    const username = profile?.username;
    const imageUrl = profile?.avatarUrl || commanderAvatarUrl || clerkImageUrl;
    const hasAdminAccess = profile?.role === 'ADMIN' || profile?.role === 'SYSTEM';

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
                                <div className="hidden sm:flex gap-4 items-center">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={clsx(
                                'block text-sm px-3 py-2 rounded transition-colors',
                                pathname.startsWith(link.href)
                                    ? 'bg-orange-500 text-white'
                                    : 'hover:bg-gray-800 text-gray-300'
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                                        <div className="ml-2">
                                            <SignedOut>
                                                <div className="flex gap-2">
                                                    <Link href="/sign-in" className="text-sm px-3 py-2 rounded hover:bg-gray-800 text-gray-300">Sign in</Link>
                                                    <Link href="/sign-up" className="text-sm px-3 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white">Register</Link>
                                                </div>
                                            </SignedOut>
                                                                                        <SignedIn>
                                                                                                <DropdownMenu>
                                                                                                    <DropdownMenuTrigger asChild>
                                                                                                        <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800">
                                                                                                            <Avatar className="h-8 w-8">
                                                                                                                <AvatarImage src={imageUrl} alt={displayName} />
                                                                                                                <AvatarFallback>{displayName?.slice(0,2).toUpperCase()}</AvatarFallback>
                                                                                                            </Avatar>
                                                                                                            <span className="hidden md:block text-sm text-gray-300">{displayName}</span>
                                                                                                            <ChevronsUpDown className="ml-1 size-4 text-gray-400" />
                                                                                                        </button>
                                                                                                    </DropdownMenuTrigger>
                                                                                                    <DropdownMenuContent align="end" className="min-w-56">
                                                                                                        <DropdownMenuLabel className="font-normal">
                                                                                                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                                                                                                <Avatar className="h-8 w-8">
                                                                                                                    <AvatarImage src={imageUrl} alt={displayName} />
                                                                                                                    <AvatarFallback>{displayName?.slice(0,2).toUpperCase()}</AvatarFallback>
                                                                                                                </Avatar>
                                                                                                                <div className="grid flex-1 text-left leading-tight">
                                                                                                                    <span className="truncate font-medium">{displayName}</span>
                                                                                                                    {username && <span className="truncate text-xs text-gray-400">@{username}</span>}
                                                                                                                    {!username && <span className="truncate text-xs text-gray-400">{email}</span>}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </DropdownMenuLabel>
                                                                                                        <DropdownMenuSeparator />
                                                                                                        <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="flex items-center gap-2">
                                                                                                            <Settings className="size-4" /> Settings
                                                                                                        </DropdownMenuItem>
                                                                                                        <DropdownMenuItem asChild>
                                                                                                            <Link href="/account" className="flex items-center gap-2">
                                                                                                                <User className="size-4" /> My Account
                                                                                                            </Link>
                                                                                                        </DropdownMenuItem>
                                                                                                                                                                                                                {hasAdminAccess && (
                                                                                                                                                                                                                    <DropdownMenuItem asChild>
                                                                                                                                                                                                                        <Link href="/admin" className="flex items-center gap-2">
                                                                                                                                                                                                                            <LayoutDashboard className="size-4" /> Admin panel
                                                                                                                                                                                                                        </Link>
                                                                                                                                                                                                                    </DropdownMenuItem>
                                                                                                                                                                                                                )}
                                                                                                        <DropdownMenuSeparator />
                                                                                                        <SignOutButton>
                                                                                                            <DropdownMenuItem className="text-red-500">
                                                                                                                <LogOut className="size-4" /> Log out
                                                                                                            </DropdownMenuItem>
                                                                                                        </SignOutButton>
                                                                                                    </DropdownMenuContent>
                                                                                                </DropdownMenu>
                                                                                                <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
                                                                                        </SignedIn>
                                        </div>
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
                                        <div className="mt-2 flex gap-2">
                                            <SignedOut>
                                                <Link href="/sign-in" onClick={() => setIsOpen(false)} className="text-sm px-3 py-2 rounded hover:bg-gray-800 text-gray-300">Sign in</Link>
                                                <Link href="/sign-up" onClick={() => setIsOpen(false)} className="text-sm px-3 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white">Register</Link>
                                            </SignedOut>
                                                                                        <SignedIn>
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <button onClick={() => { setSettingsOpen(true); setIsOpen(false) }} className="text-sm px-3 py-2 rounded hover:bg-gray-800 text-gray-300">Settings</button>
                                                                                                    <Link href="/account" onClick={() => setIsOpen(false)} className="text-sm px-3 py-2 rounded hover:bg-gray-800 text-gray-300">My Account</Link>
                                                                                                                                                                                                        {hasAdminAccess && (
                                                                                                                                                                                                            <Link href="/admin" onClick={() => setIsOpen(false)} className="text-sm px-3 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white">Admin panel</Link>
                                                                                                                                                                                                        )}
                                                                                                </div>
                                                                                        </SignedIn>
                                        </div>
                                </div>
                        )}
        </nav>
    );
}
