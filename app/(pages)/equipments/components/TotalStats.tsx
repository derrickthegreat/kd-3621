'use client'

type TotalStatsProps = {
    stats: Record<string, number>;
};

export default function TotalStats({ stats }: TotalStatsProps) {
    return (
        <div>
            <h3 className="text-xl font-semibold mb-2">Total Stats</h3>
            {Object.keys(stats).length === 0 ? (
                <p className="text-sm text-blue-400 italic">No stats available</p>
            ) : (
                <ul className="text-sm text-blue-300 space-y-1">
                    {Object.entries(stats).map(([stat, val]) => (
                        <li key={stat}>
                            {stat}: +{val}%
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
