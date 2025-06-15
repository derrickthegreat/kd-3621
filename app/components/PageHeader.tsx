'use client';

import Link from 'next/link';

type PageHeaderProps = {
    title: string;
};

export default function PageHeader({ title }: PageHeaderProps) {
    return (
        // Flex container for title and "Back to Home" link
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2 sm:gap-0">
            {/* Main heading with gradient text */}
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-300 text-transparent bg-clip-text">
                {title}
            </h1>

            {/* Right-aligned back link */}
            <div className="flex justify-end">
                <Link
                    href="/"
                    className="text-sm sm:text-base px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700 border border-gray-600 transition-colors"
                >
                    &lt; Back to Home
                </Link>
            </div>
        </div>
    );
}
