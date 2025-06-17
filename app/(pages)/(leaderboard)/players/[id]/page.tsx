'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatNumber } from '@/app/utils/format';
import { getInitials, getRandomColor } from '@/app/utils/colors';
import PageHeader from '@/app/components/PageHeader';

export default function PlayerProfilePage() {
    const { id } = useParams();                      // Get player ID from route parameters
    const [player, setPlayer] = useState<any>(null); // Store the fetched player data

    // Load players from JSON and find the matching ID
    useEffect(() => {
        fetch('/data/players.json')
            .then((res) => res.json())
            .then((data) => {
                const found = data.find((p: any) => p.ID === id);
                setPlayer(found);
            });
    }, [id]);

    // Show loading state until player is fetched
    if (!player) return <div className="p-6 text-white">Loading...</div>;

    // Define stats to display in sections
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
        ['T45 Kills', player['T45 Kills']],
        ['Ranged', player['Ranged']]
    ];

    const farmStats = [
        ['Rss Gathered', player['Rss Gathered']],
        ['Rss Assistance', player['Rss Assistance']],
        ['Helps', player.Helps],
        ['Alliance', player.Alliance]
    ];

    return (
        <>
            <main className="min-h-screen bg-gray-950 text-white font-sans">
                <div className="container mx-auto px-4 py-6">
                    {/* Header and back button */}
                    <PageHeader title="Player profile" />

                    {/* Avatar and player info */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-full ${getRandomColor(player.Name)} flex items-center justify-center text-white font-bold text-xl`}>
                            {getInitials(player.Name)}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">{player.Name}</h2>
                            <p className="text-sm text-gray-400">ID: #{player.ID}</p>
                        </div>
                    </div>

                    {/* KvK and Career side by side */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-6 items-start">
                        {/* KvK section */}
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold mb-2">KvK Stats</h2>
                            <ul className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-1 text-sm h-full">
                                {careerStats.slice(0, 11).map(([label]) => (
                                    <li key={`kvk-${label}`} className="flex justify-between border-b border-gray-700 py-1">
                                        <span className="text-gray-400">{label}</span>
                                        <span>0</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Career section */}
                        <div className="flex-1">
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

                    {/* Farm stats below */}
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
        </>
    );
}
