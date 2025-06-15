'use client';

type PaginationProps = {
    currentPage: number;                  // Current active page
    total: number;                        // Total number of pages
    onPageChange: (page: number) => void; // Callback when a page is clicked
    className?: string;                   // Optional custom class
};

export default function Pagination({
    currentPage,
    total,
    onPageChange,
}: PaginationProps) {
    // Generate an array of page numbers to display, including ellipsis
    const getPages = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];

        // Show all if few pages
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        pages.push(1);

        if (currentPage > 4) pages.push('...');

        // Show 2 pages before and after current
        for (let i = Math.max(2, currentPage - 2); i <= Math.min(total - 1, currentPage + 2); i++) {
            pages.push(i);
        }

        if (currentPage < total - 3) pages.push('...');

        pages.push(total);

        return pages;
    };

    return (
        <div className="flex items-center gap-1 text-sm">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
            >
                &lt;
            </button>

            {/* Page Buttons */}
            {getPages().map((p, i) =>
                p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-gray-500">...</span>
                ) : (
                    <button
                        key={`page-${p}`}
                        onClick={() => onPageChange(p)}
                        className={`px-3 py-1 rounded ${currentPage === p
                                ? 'bg-orange-500 text-white'
                                : 'hover:bg-gray-800 text-gray-300'
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            {/* Next Button */}
            <button
                onClick={() => onPageChange(Math.min(total, currentPage + 1))}
                disabled={currentPage === total}
                className="px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
            >
                &gt;
            </button>
        </div>
    );
}
