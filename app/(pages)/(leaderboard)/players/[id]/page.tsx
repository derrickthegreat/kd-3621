'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatNumber } from '@/app/utils/format';
import { getInitials, getRandomColor } from '@/app/utils/colors';
import PageHeader from '@/app/components/PageHeader';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function PlayerProfilePage() {
    const { id } = useParams();
    const [player, setPlayer] = useState<any>(null);
    const [diffs, setDiffs] = useState<any>(null);

    useEffect(() => {
        Promise.all([
            fetch('/data/players.json').then((res) => res.json()),
            fetch('/data/playersFinal.json').then((res) => res.json()),
        ]).then(([initial, final]) => {
            const initialP = initial.find((p: any) => p.ID === id);
            const finalP = final.find((p: any) => p.ID === id);

            if (!finalP) return; // fallback

            setPlayer(finalP);

            if (!initialP) return; // no diff available

            const diff = {
                Killpoints: Math.max((finalP.Killpoints ?? 0) - (initialP.Killpoints ?? 0), 0),
                Deads: Math.max((finalP.Deads ?? 0) - (initialP.Deads ?? 0), 0),
                'T1 Kills': Math.max((finalP['T1 Kills'] ?? 0) - (initialP['T1 Kills'] ?? 0), 0),
                'T2 Kills': Math.max((finalP['T2 Kills'] ?? 0) - (initialP['T2 Kills'] ?? 0), 0),
                'T3 Kills': Math.max((finalP['T3 Kills'] ?? 0) - (initialP['T3 Kills'] ?? 0), 0),
                'T4 Kills': Math.max((finalP['T4 Kills'] ?? 0) - (initialP['T4 Kills'] ?? 0), 0),
                'T5 Kills': Math.max((finalP['T5 Kills'] ?? 0) - (initialP['T5 Kills'] ?? 0), 0),
                'T4 + T5': Math.max((finalP['T45 Kills'] ?? 0) - (initialP['T45 Kills'] ?? 0), 0),
            };

            setDiffs(diff);
        });
    }, [id]);

    if (!player) return <div className="p-6 text-white">Loading...</div>;

    const careerStats = [
        ['Killpoints', player.Killpoints],
        ['Deads', player.Deads],
        ['T1 Kills', player['T1 Kills']],
        ['T2 Kills', player['T2 Kills']],
        ['T3 Kills', player['T3 Kills']],
        ['T4 Kills', player['T4 Kills']],
        ['T5 Kills', player['T5 Kills']],
        ['T4 + T5', player['T45 Kills']],
        ['Total Kills', player['Total Kills']],
        ['Ranged', player['Ranged']],
    ];

    const kvkStats = diffs
        ? Object.entries(diffs).map(([label, value]) => ({
            label,
            value,
            diff: value,
        }))
        : [];

    const farmStats = [
        ['Rss Gathered', player['Rss Gathered']],
        ['Rss Assistance', player['Rss Assistance']],
        ['Helps', player.Helps],
        ['Alliance', player.Alliance],
    ];

    const renderDiff = (value: number) => {
        if (!value || value <= 0) return <span className="text-gray-500">0</span>;
        return (
            <span className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUp className="h-3 w-3" />
                {formatNumber(value)}
            </span>
        );
    };

    return (
        <main className="min-h-screen bg-gray-950 text-white font-sans">
            <div className="container mx-auto px-4 py-6">
                <PageHeader title="Governor Profile" />

                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full ${getRandomColor(player.Name)} flex items-center justify-center text-white font-bold text-xl`}>
                        {getInitials(player.Name)}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{player.Name}</h2>
                        <p className="text-sm text-gray-400">ID: #{player.ID}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 mb-6 items-start">
                    {/* KvK Stats */}
                    <div className="w-full sm:flex-1">
                        <h2 className="text-lg font-semibold mb-2">KvK Stats</h2>
                        <ul className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-1 text-sm h-full">
                            {kvkStats.map(({ label, value }) => (
                                <li key={`kvk-${label}`} className="flex justify-between border-b border-gray-700 py-1">
                                    <span className="text-gray-400">{label}</span>
                                    {renderDiff(value as number)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Career Stats */}
                    <div className="w-full sm:flex-1">
                        <h2 className="text-lg font-semibold mb-2">Career Stats</h2>
                        <ul className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-1 text-sm h-full">
                            {careerStats.map(([label, value]) => (
                                <li key={`career-${label}`} className="flex justify-between border-b border-gray-700 py-1">
                                    <span className="text-gray-400">{label}</span>
                                    <span>{label === 'Alliance' ? value : formatNumber(value)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Farm stats */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-2">Farm Stats</h2>
                    <ul className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-1 text-sm">
                        {farmStats.map(([label, value]) => (
                            <li key={`farm-${label}`} className="flex justify-between border-b border-gray-700 py-1">
                                <span className="text-gray-400">{label}</span>
                                <span>{label === 'Alliance' ? value : formatNumber(value)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </main>
    );
}
