'use client';

import { useEffect, useState } from 'react';
import { formatNumber } from '@/app/utils/format';
import { sortArray } from '@/app/utils/sort';
import PageHeader from '@/app/components/PageHeader';
import DataTable from '@/app/(pages)/(leaderboard)/components/DataTable';
import type { DataTableColumn } from '@/app/(pages)/(leaderboard)/components/DataTable';
import PaginationFooter from '../components/PaginationFooter';
import { ENTRIES_PER_PAGE } from '@/app/(pages)/(leaderboard)/constants/pagination';

// Alliance data structure
type Alliance = {
    '#': number;     // Rank position
    Tag: string;     // Alliance tag (e.g., [ABC])
    Name: string;    // Alliance name
    Score: number;   // Total power
};

// Table column configuration
const columns: DataTableColumn<Alliance>[] = [
    { key: '#', label: '#', icon: '' },
    { key: 'Name', label: 'Name', icon: '/icons/alliance.png' },
    { key: 'Tag', label: 'Tag', icon: '/icons/tag.png' },
    {
        key: 'Score',
        label: 'Power',
        icon: '/icons/power.png',
        render: (row) => formatNumber(row.Score), // Format score with commas
    },
];

export default function AlliancesPage() {
    // States for data, search input, pagination, and sorting
    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<keyof Alliance>('#');
    const [sortAsc, setSortAsc] = useState(true);

    const PER_PAGE = 20;

    // Fetch alliance data from JSON on initial load
    useEffect(() => {
        fetch('/data/alliances.json')
            .then((res) => res.json())
            .then(setAlliances);
    }, []);

    // Filter alliances based on search term
    const filtered = alliances.filter((a) =>
        `${a.Name} ${a.Tag}`.toLowerCase().includes(search.toLowerCase())
    );

    // Sort alliances by selected column and direction
    const sorted = sortArray(filtered, sortKey, sortAsc);
    const totalPages = Math.ceil(sorted.length / PER_PAGE);
    const current = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Calculate total power for display
    const totalPower = alliances.reduce((acc, a) => acc + a.Score, 0);

    return (
        <>
            <main className="min-h-screen bg-gray-950 text-white font-sans">
                <div className="container mx-auto px-4 py-6">
                    {/* Page title */}
                    <PageHeader title="Alliances Rankings" />

                    {/* Search input */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by name or TAG..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="w-full max-w-sm bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                        />
                    </div>


                    {/* Kingdom total power summary */}
                    <p className="text-sm text-gray-400 mb-2">
                        Kingdom total power:{' '}
                        <span className="text-white font-semibold">
                            {formatNumber(totalPower)}
                        </span>
                    </p>

                    {/* DataTable with sorting and pagination */}
                    <DataTable
                        sortKey={sortKey}
                        sortAsc={sortAsc}
                        onSort={(key) => {
                            const typedKey = key as keyof Alliance;
                            if (sortKey === typedKey) {
                                setSortAsc((prev) => !prev);
                            } else {
                                setSortKey(typedKey);
                                setSortAsc(true);
                            }
                        }}
                        columns={columns}
                        data={current}
                        getRowKey={(row) => row['#']}
                    />

                    {/* Pagination footer */}
                    <PaginationFooter
                        currentPage={page}
                        totalPages={totalPages}
                        totalEntries={sorted.length}
                        entriesPerPage={ENTRIES_PER_PAGE}
                        onPageChange={setPage}
                    />
                </div>
            </main>
        </>
    );
}
