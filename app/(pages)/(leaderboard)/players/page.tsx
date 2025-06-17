'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/app/components/PageHeader';
import DataTable, { DataTableColumn } from '@/app/(pages)/(leaderboard)/components/DataTable';
import { formatNumber } from '@/app/utils/format';
import { getDKPPercentage } from '@/app/utils/dkp';
import { getInitials, getRandomColor } from '@/app/utils/colors';
import { ENTRIES_PER_PAGE } from '@/app/(pages)/(leaderboard)/constants/pagination';
import PaginationFooter from '../components/PaginationFooter';

export default function PlayersPage() {
    // State management for data, search, pagination, and sorting
    const [players, setPlayers] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string>('');
    const [sortAsc, setSortAsc] = useState(true);

    // Fetch players data once on component mount
    useEffect(() => {
        fetch('/data/players.json')
            .then((res) => res.json())
            .then(setPlayers);
    }, []);

    // Filter players by name or ID
    const filtered = players.filter((p) => {
        const term = search.toLowerCase();
        return (
            p.Name?.toLowerCase().includes(term) ||
            p.ID?.toString().includes(term)
        );
    });

    // Sort players based on selected column
    const sorted = [...filtered].sort((a, b) => {
        if (!sortKey) return 0;
        const valA = a[sortKey] ?? 0;
        const valB = b[sortKey] ?? 0;
        return sortAsc ? valA - valB : valB - valA;
    });

    const totalPages = Math.ceil(sorted.length / ENTRIES_PER_PAGE);
    const current = sorted.slice((page - 1) * ENTRIES_PER_PAGE, page * ENTRIES_PER_PAGE);

    // Table columns definition
    const columns: DataTableColumn<any>[] = [
        {
            key: '#',
            label: '#',
            sortable: true,
        },
        {
            key: 'Name',
            label: 'Player',
            sortable: false,
            icon: '/icons/player.png',
            render: (player) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${getRandomColor(player.Name)} flex items-center justify-center text-white font-medium text-xs`}>
                        {getInitials(player.Name)}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400">#{player.ID}</span>
                        <a
                            href={`/players/${player.ID}`}
                            className="font-medium text-sm text-white max-w-[100px] truncate hover:underline"
                        >
                            {player.Name}
                        </a>
                    </div>
                </div>
            ),
        },
        {
            key: 'DKP',
            label: 'DKP',
            sortable: true,
            icon: '/icons/dkp.png',
            render: (p) => {
                const dkp = 0;
                const percent = getDKPPercentage(dkp, p.Power);
                return (
                    <div className="w-48">
                        <span className="font-medium text-sm">{dkp}</span>
                        <div className="mt-1 h-4 w-full bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50 relative">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300"
                                style={{ width: `${percent}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-medium">
                                <span className="px-1 bg-black/30 rounded">{percent}% reached</span>
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'Power',
            label: 'Power',
            sortable: true,
            icon: '/icons/power.png',
            render: (p) => <span className="font-medium text-sm">{formatNumber(p.Power)}</span>,
        },
        {
            key: 'T4 Kills',
            label: 'T4 Kills',
            sortable: true,
            icon: '/icons/t4.png',
            render: () => 0,
        },
        {
            key: 'T5 Kills',
            label: 'T5 Kills',
            sortable: true,
            icon: '/icons/t5.png',
            render: () => 0,
        },
        {
            key: 'T45 Kills',
            label: 'T4 + T5',
            sortable: true,
            icon: '/icons/t4t5.png',
            render: () => 0,
        },
        {
            key: 'deaths',
            label: 'Deaths',
            sortable: true,
            icon: '/icons/deaths.png',
            render: () => 0,
        },
    ];

    return (
        <>
            <main className="min-h-screen bg-gray-950 text-white font-sans">
                <div className="container mx-auto px-4 py-6">
                    {/* Page title */}
                    <PageHeader title="Player Rankings" />

                    {/* Search input */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full max-w-sm bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                        />
                    </div>

                    {/* Data table with sorting */}
                    <DataTable
                        data={current}
                        columns={columns}
                        sortKey={sortKey}
                        sortAsc={sortAsc}
                        onSort={(key) => {
                            const keyStr = String(key);
                            if (sortKey === keyStr) setSortAsc(!sortAsc);
                            else {
                                setSortKey(keyStr);
                                setSortAsc(true);
                            }
                        }}
                        getRowKey={(row) => row.ID ?? row['#']}
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
