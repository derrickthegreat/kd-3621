'use client';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import commanders from '@/public/data/commanders.json';
import PageHeader from '@/app/components/PageHeader';

export default function CommanderBuildPage() {
    const { name } = useParams();
    const commander = commanders.find((c) => c.image.replace('.png', '') === name);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    if (!commander) return notFound();

    return (
        <main className="p-6 text-white bg-gray-950 min-h-screen">

            <PageHeader title="Commander Builds" />

            <h1 className="text-3xl font-bold mb-4 text-center">{commander.name} Builds</h1>

            <div className="flex justify-center mb-6">
                <Image
                    src={`/icons/commanders/${commander.image}`}
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
                            src={`/talent-trees/${build.image}`}
                            alt={build.name}
                            width={800}
                            height={600}
                            className="rounded shadow border border-gray-700 cursor-zoom-in mx-auto hover:brightness-110 transition"
                            onClick={() => setExpandedImage(`/talent-trees/${build.image}`)}
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
