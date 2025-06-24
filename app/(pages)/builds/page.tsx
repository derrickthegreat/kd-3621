'use client';
import React, { useState, useRef, useEffect } from 'react';
import commanders from '@/public/data/commanders.json';
import PageHeader from '@/app/components/PageHeader';
import AlphabetSidebar from './components/AlphabetSidebar';
import CommanderGroup from './components/CommanderGroup';


export default function BuildsPage() {
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [activeLetter, setActiveLetter] = useState<string | null>(null);
    const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownButtonRef = useRef<HTMLButtonElement>(null);
    const [showAllDetails, setShowAllDetails] = useState(false);

    const toggleDetails = (name: string) => {
        setExpanded((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const allAttributes = Array.from(
        new Set(
            commanders.flatMap((c) =>
                (c.attributes ?? []).filter((a) => a && a.trim() !== '')
            )
        )
    ).sort();


    const filtered = [...commanders]
        .filter(
            (c) =>
                c.name.toLowerCase().includes(search.toLowerCase()) &&
                (selectedAttributes.length === 0 ||
                    selectedAttributes.every((attr) => c.attributes?.includes(attr)))
        )
        .sort((a, b) => a.name.localeCompare(b.name));


    const grouped = filtered.reduce((acc, c) => {
        const letter = c.name[0].toUpperCase();
        acc[letter] = acc[letter] || [];
        acc[letter].push(c);
        return acc;
    }, {} as Record<string, typeof commanders>);

    const sectionRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});

    Object.keys(grouped).forEach((letter) => {
        if (!sectionRefs.current[letter]) {
            sectionRefs.current[letter] = React.createRef<HTMLDivElement>();
        }
    });


    const scrollTo = (letter: string) => {
        const section = sectionRefs.current[letter]?.current;
        if (section) section.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntries = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                const firstVisible = visibleEntries[0]?.target.getAttribute('data-letter');
                if (firstVisible) {
                    setActiveLetter(firstVisible);
                }
            },
            {
                root: null,
                rootMargin: '-30% 0px -70% 0px', // Foco no topo
                threshold: 0,
            }
        );

        Object.entries(sectionRefs.current).forEach(([letter, ref]) => {
            if (ref.current) {
                ref.current.setAttribute('data-letter', letter);
                observer.observe(ref.current);
            }
        });

        return () => observer.disconnect();
    }, [grouped]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <main className="text-white bg-gray-950 min-h-screen p-6">
            <PageHeader title="Commanders Builds" />

            <div className="min-h-[80vh] md:grid md:grid-cols-12 gap-6 mt-6">

                <AlphabetSidebar
                    letters={Object.keys(grouped).sort()}
                    activeLetter={activeLetter}
                    onClickLetter={scrollTo}
                />

                <section className="col-span-12 md:col-span-11 space-y-6">

                    <div className="mb-4 flex flex-wrap items-center gap-4">
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-auto max-w-sm bg-gray-800 text-white border border-gray-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
                        />

                        {/* Select de atributos */}
                        <div className="relative inline-block" ref={dropdownRef}>
                            <button
                                type="button"
                                ref={dropdownButtonRef}
                                onClick={() => setShowDropdown((prev) => !prev)}
                                className="bg-gray-800 border border-gray-700 text-sm text-white rounded px-3 py-2 w-64 text-left"
                            >
                                {selectedAttributes.length > 0
                                    ? `${selectedAttributes.length} attribute${selectedAttributes.length > 1 ? 's' : ''} selected`
                                    : 'Filter by attributes'}
                            </button>

                            {showDropdown && (
                                <div
                                    className="absolute z-10 mt-1 max-h-64 overflow-auto bg-gray-900 border border-gray-700 rounded shadow-lg"
                                    style={{ width: dropdownButtonRef.current?.clientWidth ?? '16rem' }}
                                >
                                    {allAttributes.map((attr) => (
                                        <label
                                            key={attr}
                                            className="flex items-center px-3 py-2 hover:bg-gray-800 cursor-pointer text-sm"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedAttributes.includes(attr)}
                                                onChange={() =>
                                                    setSelectedAttributes((prev) =>
                                                        prev.includes(attr)
                                                            ? prev.filter((a) => a !== attr)
                                                            : [...prev, attr]
                                                    )
                                                }
                                                className="mr-2 accent-orange-500"
                                            />
                                            <span className="capitalize text-white">{attr}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>


                        {/* Botão de limpar filtros */}
                        {selectedAttributes.length > 0 && (
                            <button
                                onClick={() => setSelectedAttributes([])}
                                className="text-sm text-orange-400 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}


                        {filtered.length > 0 && (
                            <button
                                onClick={() => {
                                    const newState: Record<string, boolean> = {};
                                    filtered.forEach((c) => {
                                        newState[c.name] = !showAllDetails;
                                    });
                                    setExpanded(newState);
                                    setShowAllDetails((prev) => !prev);
                                }}
                                className="text-sm bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition"
                            >
                                {showAllDetails ? 'Hide All Details' : 'Show All Details'}
                            </button>
                        )}

                    </div>



                    {Object.keys(grouped).sort().map((letter) => (
                        <CommanderGroup
                            key={letter}
                            letter={letter}
                            commanders={grouped[letter]}
                            ref={sectionRefs.current[letter]}
                            expanded={expanded}
                            toggleDetails={toggleDetails}
                        />
                    ))}
                </section>
            </div>
        </main>
    );
}
