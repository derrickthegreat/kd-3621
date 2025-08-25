// @/src/components/PaginationFooter.tsx
'use client'

import Pagination from './Pagination'

type PaginationFooterProps = {
    currentPage: number
    totalPages: number
    totalEntries: number
    entriesPerPage: number
    onPageChange: (page: number) => void
}

export default function PaginationFooter({
    currentPage,
    totalPages,
    totalEntries,
    entriesPerPage,
    onPageChange,
}: PaginationFooterProps) {
    const start = totalEntries === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1
    const end = Math.min(currentPage * entriesPerPage, totalEntries)

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-gray-900/50 mt-6 border border-gray-800 rounded-lg text-sm">
            <span className="text-gray-400">
                Showing {start} to {end} of {totalEntries} entries
            </span>

            <Pagination
                currentPage={currentPage}
                total={totalPages}
                onPageChange={onPageChange}
            />
        </div>
    )
}
