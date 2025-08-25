import Image from 'next/image';
import Link from 'next/link';

interface Props {
    commander: any;
    expanded: boolean;
    toggleDetails: (name: string) => void;
}

export default function CommanderCard({ commander, expanded, toggleDetails }: Props) {

    const rarityColors: Record<string, string> = {
        Legendary: 'border-yellow-500',
        Epic: 'border-purple-500',
    };

    const borderColor = rarityColors[commander.rarity] || 'border-white';

    const hasBuilds =
        Array.isArray(commander.builds) &&
        commander.builds.some(
            (build: any) => build.name?.trim() && build.image?.trim()
        );
    const hasAttributes =
        Array.isArray(commander.attributes) &&
        commander.attributes.some(
            (attribute: any) => attribute?.trim()
        );


    return (
        <li className={`bg-gray-900 ${borderColor} border-2 rounded-lg px-4 py-3 shadow hover:bg-gray-800 transition`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3 min-w-[200px]">
                    <Image
                        src={commander.image.startsWith('/') ? commander.image : `/icons/commanders/${commander.image}`}
                        alt={commander.name}
                        width={56}
                        height={56}
                    />
                    <span className="font-semibold text-lg">{commander.name}</span>
                </div>

                {expanded && (
                    <div className="flex items-center gap-4 flex-wrap">
                        {hasAttributes && (commander.attributes.map((attribute: string) => (
                            <div key={attribute} className="flex items-center gap-1">
                                <Image
                                    src={`/icons/${attribute.toLowerCase()}.png`}
                                    alt={attribute}
                                    width={24}
                                    height={24}
                                />
                                <span className="text-sm text-gray-300 capitalize">{attribute}</span>
                            </div>
                        )))}
                    </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    {hasBuilds && (
                        <Link href={`/builds/${getSlug(commander.image)}`}>
                            <button className="cursor-pointer bg-orange-400 hover:bg-orange-500 text-white text-sm font-semibold px-3 py-1.5 rounded-full">
                                Best Builds & Pairings
                            </button>
                        </Link>
                    )}
                    {hasAttributes && (
                        <button
                            onClick={() => toggleDetails(commander.name)}
                            className="cursor-pointer border border-white text-white text-sm px-3 py-1.5 rounded-full hover:bg-white hover:text-black transition"
                        >
                            {expanded ? 'Hide' : 'Details'}
                        </button>
                    )}
                </div>
            </div>
        </li>
    );
}

function getSlug(img: string) {
    const file = (img || '').split('/').pop() || ''
    return file.replace(/\.[a-zA-Z0-9]+$/, '')
}
