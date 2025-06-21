'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/app/components/PageHeader';
import DataTable, { DataTableColumn } from '@/app/(pages)/(leaderboard)/components/DataTable';
import { formatNumber } from '@/app/utils/format';
import { getDKPPercentage } from '@/app/utils/dkp';
import { getInitials, getRandomColor } from '@/app/utils/colors';
import { ENTRIES_PER_PAGE } from '@/app/(pages)/(leaderboard)/constants/pagination';
import PaginationFooter from '../components/PaginationFooter';
import { ArrowUp, ArrowDown } from 'lucide-react';


export default function PlayersPage() {
    const [players, setPlayers] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string>('');
    const [sortAsc, setSortAsc] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/data/players.json').then((res) => res.json()),
            fetch('/data/playersFinal.json').then((res) => res.json()),
        ]).then(([initialData, finalData]) => {
            const finalMap = new Map<number, any>();
            finalData.forEach((p: any) => finalMap.set(Number(p.ID), p));

            const merged = initialData.map((p: any) => {
                const id = Number(p.ID);
                const final = finalMap.get(id);

                const initialKillpoints = Number(p.Killpoints) || 0;
                const finalKillpoints = final?.Killpoints ? Number(final.Killpoints) : initialKillpoints;
                const killpointsDiff = Math.max(finalKillpoints - initialKillpoints, 0);

                const t4Init = Number(p["T4 Kills"]) || 0;
                const t5Init = Number(p["T5 Kills"]) || 0;
                const deadsInit = Number(p["Deads"]) || 0;

                const initialPower = Number(p.Power) || 0;
                const powerFinal = final?.Power ? Number(final.Power) : initialPower;

                const t4Final = final?.["T4 Kills"] ? Number(final["T4 Kills"]) : t4Init;
                const t5Final = final?.["T5 Kills"] ? Number(final["T5 Kills"]) : t5Init;
                const deadsFinal = final?.["Deads"] ? Number(final["Deads"]) : deadsInit;

                const t4Diff = Math.max(t4Final - t4Init, 0);
                const t5Diff = Math.max(t5Final - t5Init, 0);
                const t45Diff = t4Diff + t5Diff;
                const deadsDiff = Math.max(deadsFinal - deadsInit, 0);
                //const dkp = Math.max(finalKillpoints - initialKillpoints, 0);
                const dkp = (t4Diff * 10) + (t5Diff * 20) + (deadsDiff * 30);

                return {
                    ...p,
                    Power: powerFinal,
                    InitialPower: initialPower,
                    InitialKillpoints: initialKillpoints,
                    Killpoints: finalKillpoints,
                    KillpointsDiff: killpointsDiff,
                    DKP: dkp,
                    'T4 Kills': t4Diff,
                    'T5 Kills': t5Diff,
                    'T45 Kills': t45Diff,
                    Deads: deadsDiff,
                };
            });

            setPlayers(merged);
        });
    }, []);


    const filtered = players.filter((p) => {
        const term = search.toLowerCase();
        return (
            p.Name?.toLowerCase().includes(term) ||
            p.ID?.toString().includes(term)
        );
    });

    const sorted = [...filtered].sort((a, b) => {
        if (!sortKey) return 0;
        const valA = a[sortKey] ?? 0;
        const valB = b[sortKey] ?? 0;
        return sortAsc ? valA - valB : valB - valA;
    });

    const totalPages = Math.ceil(sorted.length / ENTRIES_PER_PAGE);
    const current = sorted.slice((page - 1) * ENTRIES_PER_PAGE, page * ENTRIES_PER_PAGE);

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
            label: 'Season DKP',
            sortable: true,
            icon: '/icons/dkp.png',
            render: (p) => {
                const dkp = p.DKP ?? 0;
                const percent = getDKPPercentage(dkp, p.InitialPower);
                return (
                    <div className="w-48">
                        <span className="font-medium text-sm">{formatNumber(dkp)}</span>
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
            key: 'KillpointsDiff',
            label: 'Total KP',
            sortable: true,
            icon: '/icons/dkp.png',
            render: (p) => {
                const current = p.Killpoints ?? 0;
                const initial = p.InitialKillpoints ?? current;
                const diff = current - initial;
                const diffFormatted = formatNumber(Math.abs(diff));
                const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';

                return (
                    <div title={`Initial: ${formatNumber(initial)}`} className="flex flex-col leading-tight">
                        <span className="font-medium text-sm">{formatNumber(current)}</span>
                        {diff !== 0 && (
                            <span className="text-xs flex items-center gap-1">
                                {diff > 0 ? (
                                    <ArrowUp className="h-3 w-3 text-green-400" />
                                ) : (
                                    <ArrowDown className="h-3 w-3 text-red-400" />
                                )}
                                <span className={diff > 0 ? 'text-green-400' : 'text-red-400'}>
                                    {sign}{diffFormatted}
                                </span>
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'Power',
            label: 'Power',
            sortable: true,
            icon: '/icons/power.png',
            render: (p) => {
                const power = p.Power ?? 0;
                const initialPower = p.InitialPower ?? power;
                const diff = power - initialPower;
                const diffFormatted = formatNumber(Math.abs(diff));
                const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';

                return (
                    <div title={`Initial: ${formatNumber(initialPower)}`} className="flex flex-col leading-tight">
                        <span className="font-medium text-sm">{formatNumber(power)}</span>
                        {diff !== 0 && (
                            <span className="text-xs flex items-center gap-1">
                                {diff > 0 ? (
                                    <ArrowUp className="h-3 w-3 text-green-400" />
                                ) : (
                                    <ArrowDown className="h-3 w-3 text-red-400" />
                                )}
                                <span className={diff > 0 ? 'text-green-400' : 'text-red-400'}>
                                    {sign}{diffFormatted}
                                </span>
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'T4 Kills',
            label: 'T4 Kills',
            sortable: true,
            icon: '/icons/t4.png',
            render: (p) => <span className="font-medium text-sm">{formatNumber(p['T4 Kills'])}</span>,
        },
        {
            key: 'T5 Kills',
            label: 'T5 Kills',
            sortable: true,
            icon: '/icons/t5.png',
            render: (p) => <span className="font-medium text-sm">{formatNumber(p['T5 Kills'])}</span>,
        },
        {
            key: 'T45 Kills',
            label: 'T4 + T5',
            sortable: true,
            icon: '/icons/t4t5.png',
            render: (p) => <span className="font-medium text-sm">{formatNumber(p['T45 Kills'])}</span>,
        },
        {
            key: 'deaths',
            label: 'Deaths',
            sortable: true,
            icon: '/icons/deaths.png',
            render: (p) => <span className="font-medium text-sm">{formatNumber(p.Deads)}</span>,
        },
    ];

    return (
        <main className="min-h-screen bg-gray-950 text-white font-sans">
            <div className="container mx-auto px-4 py-6">
                <PageHeader title="Player Rankings" />

                <div className="flex items-center justify-between px-4 py-3 mb-4 bg-gray-900 rounded border border-gray-800 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-amber-500 font-medium whitespace-nowrap">
                            DKP FORMULA :
                        </span>
                        <span className="inline-flex items-center">
                            <span className="text-green-300">T4 KILLS</span>
                            <span className="text-amber-500 whitespace-nowrap ml-1">×10</span>
                        </span>
                        <span className="text-green-400 font-bold">+</span>
                        <span className="inline-flex items-center">
                            <span className="text-green-300">T5 KILLS</span>
                            <span className="text-amber-500 whitespace-nowrap ml-1">×20</span>
                        </span>
                        <span className="text-green-400 font-bold">+</span>
                        <span className="inline-flex items-center">
                            <span className="text-green-300">DEAD TROOPS</span>
                            <span className="text-amber-500 whitespace-nowrap ml-1">×30</span>
                        </span>
                    </div>
                </div>

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

                <PaginationFooter
                    currentPage={page}
                    totalPages={totalPages}
                    totalEntries={sorted.length}
                    entriesPerPage={ENTRIES_PER_PAGE}
                    onPageChange={setPage}
                />
            </div>
        </main>
    );
}
