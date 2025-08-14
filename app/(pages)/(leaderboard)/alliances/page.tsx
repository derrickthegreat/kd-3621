'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import PageHeader from '@/app/components/PageHeader';
import DataTable, { DataTableColumn } from '@/app/(pages)/(leaderboard)/components/DataTable';
import { formatNumber } from '@/app/utils/format';
import { sortArray } from '@/app/utils/sort';

type Alliance = {
    '#': number;
    Tag: string;
    Name: string;
    Score: number;
    InitialScore?: number;
    ScoreDiff?: number;
};

export default function AlliancesPage() {
    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<keyof Alliance>('#');
    const [sortAsc, setSortAsc] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/data/alliancesFinal_v2.json').then((res) => res.json()),
            fetch('/data/alliances_v2.json').then((res) => res.json()),
        ]).then(([finalData, initialData]) => {
            const initialMap = new Map<string, number>();
            initialData.forEach((a: Alliance) => {
                initialMap.set(a.Tag, a.Score);
            });

            const merged = finalData.map((a: Alliance) => {
                const initial = initialMap.get(a.Tag) ?? a.Score;
                const diff = a.Score - initial;
                return {
                    ...a,
                    InitialScore: initial,
                    ScoreDiff: diff,
                };
            });

            setAlliances(merged);
        });
    }, []);

    const filtered = alliances.filter((a) =>
        `${a.Name} ${a.Tag}`.toLowerCase().includes(search.toLowerCase())
    );

    const sorted = sortArray(filtered, sortKey, sortAsc);
    const totalPower = alliances.reduce((acc, a) => acc + a.Score, 0);

    const columns: DataTableColumn<Alliance>[] = [
        { key: '#', label: '#', icon: '' },
        { key: 'Name', label: 'Name', icon: '/icons/alliance.png' },
        { key: 'Tag', label: 'Tag', icon: '/icons/tag.png' },
        {
            key: 'Score',
            label: 'Power',
            icon: '/icons/power.png',
            render: (a) => {
                const power = a.Score ?? 0;
                const initial = a.InitialScore ?? power;
                const diff = power - initial;
                const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
                const diffFormatted = formatNumber(Math.abs(diff));

                return (
                    <div title={`Initial: ${formatNumber(initial)}`} className="flex flex-col leading-tight">
                        <span className="font-medium text-sm">{formatNumber(power)}</span>
                        {diff !== 0 && (
                            <span className="text-xs flex items-center gap-1">
                                {diff > 0 ? (
                                    <ArrowUp className="h-3 w-3 text-green-400" />
                                ) : (
                                    <ArrowDown className="h-3 w-3 text-red-400" />
                                )}
                                <span className={diff > 0 ? 'text-green-400' : 'text-red-400'}>
                                    {sign}
                                    {diffFormatted}
                                </span>
                            </span>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <main className="min-h-screen bg-gray-950 text-white font-sans">
            <div className="container mx-auto px-4 py-6">
                <PageHeader title="Alliances Rankings" />

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or TAG..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-sm bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                    />
                </div>

                <p className="text-sm text-gray-400 mb-2">
                    Kingdom total power:{' '}
                    <span className="text-white font-semibold">{formatNumber(totalPower)}</span>
                </p>

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
                    data={sorted}
                    getRowKey={(row) => row['#']}
                />
            </div>
        </main>
    );
}
