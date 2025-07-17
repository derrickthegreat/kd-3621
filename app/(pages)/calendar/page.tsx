'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import PageHeader from '@/app/components/PageHeader';
import CalendarGrid from './components/CalendarGrid';
import CalendarHeader from './components/CalendarHeader';
import EventDetails from './components/EventDetails';
import { expandEvents, CalendarEvent, EventInstance } from './utils/expandEvents';

dayjs.extend(isBetween);

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [instances, setInstances] = useState<EventInstance[]>([]);
    const [includeKvK, setIncludeKvK] = useState(false);
    const [hasKvKEvents, setHasKvKEvents] = useState(false);

    useEffect(() => {
        fetch('/data/events.json')
            .then((res) => res.json())
            .then(setEvents);
    }, []);

    useEffect(() => {
        const start = currentMonth.startOf('month').startOf('week');
        const end = currentMonth.endOf('month').endOf('week');

        const filteredEvents = events.filter((event) =>
            includeKvK
                ? true
                : !event.pattern.every((p: any) => p.frequency === 'once')
        );

        setInstances(expandEvents(filteredEvents, start, end));

        const kvkEventsExist = events.some((event) =>
            event.pattern.some((p: any) =>
                p.frequency === 'once' &&
                dayjs(p.startDate).isBetween(start, end, 'day', '[]')
            )
        );
        setHasKvKEvents(kvkEventsExist);
    }, [events, currentMonth, includeKvK]);

    const start = currentMonth.startOf('month').startOf('week');
    const end = currentMonth.endOf('month').endOf('week');
    const days = [];
    let day = start.clone();
    while (day.isBefore(end)) {
        days.push(day);
        day = day.add(1, 'day');
    }

    const eventsByDate = instances.reduce((map, inst) => {
        if (!map[inst.date]) map[inst.date] = [];
        map[inst.date].push(inst);
        return map;
    }, {} as Record<string, EventInstance[]>);

    return (
        <main className="min-h-screen bg-gray-950 text-white font-sans">
            <div className="container mx-auto px-4 py-6">
                <PageHeader title="Calendar" />

                {hasKvKEvents && (
                    <div className="mb-6 flex items-center gap-3">
                        <div className="relative">
                            <input
                                id="include-kvk"
                                type="checkbox"
                                checked={includeKvK}
                                onChange={(e) => setIncludeKvK(e.target.checked)}
                                className="sr-only peer"
                            />
                            <label
                                htmlFor="include-kvk"
                                className="block w-11 h-6 bg-gray-600 rounded-full peer-checked:bg-orange-500 transition-colors cursor-pointer"
                            ></label>
                            <div className="pointer-events-none absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-full"></div>
                        </div>
                        <span className="text-sm text-orange-400">Include Unique/KvK events</span>
                    </div>
                )}



                <CalendarHeader currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />

                <div className="grid grid-cols-7 text-center text-xs uppercase text-orange-400 bg-blue-200/10 backdrop-blur-md border border-blue-300/10 shadow-sm font-semibold mb-2 rounded-xl">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="py-2">
                            {d}
                        </div>
                    ))}
                </div>

                <CalendarGrid
                    days={days}
                    eventsByDate={eventsByDate}
                    expandedDay={expandedDay}
                    setExpandedDay={setExpandedDay}
                    currentMonth={currentMonth}
                />

                {expandedDay && eventsByDate[expandedDay] && (
                    <EventDetails
                        expandedDay={expandedDay}
                        events={[...eventsByDate[expandedDay]].sort((a, b) =>
                            (a.startTime ?? '00:00').localeCompare(b.startTime ?? '00:00')
                        )}
                        onClose={() => setExpandedDay(null)}
                    />
                )}
            </div>
        </main>
    );
}
