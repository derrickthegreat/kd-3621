'use client';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import PageHeader from '@/app/components/PageHeader';

// TypeScript interface for Commander data from API
interface CommanderBuild {
    id: string;
    name: string;
    image: string;
    rating?: number;
    description?: string;
}

interface Commander {
    id: string;
    name: string;
    image: string;
    rarity: string;
    attributes: string[];
    builds: CommanderBuild[];
}

export default function CommanderBuildPage() {
    const { name } = useParams();
    const [commander, setCommander] = useState<Commander | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCommanders() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch('/api/v1/public/commanders');
                if (!response.ok) {
                    throw new Error('Failed to fetch commanders');
                }

                const commanders: Commander[] = await response.json();
                const foundCommander = commanders.find((c) => getSlug(c.image) === name);

                setCommander(foundCommander || null);
            } catch (error) {
                console.error('Error fetching commander:', error);
                setError(error instanceof Error ? error.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        }

        if (name) {
            fetchCommanders();
        }
    }, [name]);

    if (loading) {
        return (
            <main className="p-6 text-white bg-gray-950 min-h-screen">
                <PageHeader title="Commander Builds" />
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading commander...</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="p-6 text-white bg-gray-950 min-h-screen">
                <PageHeader title="Commander Builds" />
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-red-400 mb-4">Error loading commander: {error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    if (!commander) return notFound();

    return (
        <main className="p-6 text-white bg-gray-950 min-h-screen">

            <PageHeader title="Commander Builds" />

            <h1 className="text-3xl font-bold mb-4 text-center">{commander.name} Builds</h1>

            <div className="flex justify-center mb-6">
                <Image
                    src={commander.image.startsWith('/') ? commander.image : `/icons/commanders/${commander.image}`}
                    alt={commander.name}
                    width={100}
                    height={100}
                    className="rounded-full"
                />
            </div>

            <div className="flex justify-center gap-6 mb-6">
                {commander.attributes.map((attribute) => (
                    <div key={attribute} className="flex items-center gap-2">
                        <Image
                            src={`/icons/${attribute.toLowerCase()}.png`}
                            alt={attribute}
                            width={30}
                            height={30}
                            className="rounded-full"
                        />
                        <span className="text-sm text-gray-320">{attribute}</span>
                    </div>
                ))}
            </div>


            <div className="space-y-12">
                {commander.builds.map((build) => (
                    <div key={build.name} className="text-center" >
                        <h2 className="text-xl font-semibold mb-4">{build.name}</h2>
                        <Image
                            src={build.image.startsWith('/') ? build.image : `/talent-trees/${build.image}`}
                            alt={build.name}
                            width={800}
                            height={600}
                            className="rounded shadow border border-gray-700 cursor-zoom-in mx-auto hover:brightness-110 transition"
                            onClick={() => setExpandedImage(build.image.startsWith('/') ? build.image : `/talent-trees/${build.image}`)}
                        />
                    </div>
                ))}
            </div>

            {/* Modal */}
            {
                expandedImage && (
                    <div
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
                        onClick={() => setExpandedImage(null)}
                    >
                        <img
                            src={expandedImage}
                            alt="Expanded"
                            className="max-w-[90%] max-h-[90%] rounded-lg border border-gray-700 shadow-xl"
                        />
                    </div>
                )
            }
        </main >
    );
}

function getSlug(img: string) {
    const file = img.split('/').pop() || ''
    return file.replace(/\.[a-zA-Z0-9]+$/, '')
}
