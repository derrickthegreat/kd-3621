'use client';

import { usePathname } from 'next/navigation'
import NavButton from './NavButton';

type PageHeaderProps = {
    title: string;
};

export default function PageHeader({ title }: PageHeaderProps) {
    const pathname = usePathname()
    const isPlayerProfile = /^\/players\/[^/]+$/.test(pathname)

    const backLabel = isPlayerProfile ? 'Back to Players' : 'Back to Home'
    const backHref = isPlayerProfile ? '/players' : '/'

    return (
        // Flex container for title and "Back to Home" link
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2 sm:gap-0">
            {/* Main heading with gradient text */}
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-300 text-transparent bg-clip-text">
                {title}
            </h1>

            {/* Right-aligned back link */}
            <div className="flex justify-end">
                <NavButton
                    href={backHref}
                    label={backLabel}
                    iconLeft="←"
                    className="text-sm sm:text-base"
                />
            </div>
        </div>
    );
}
