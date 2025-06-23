'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

import PageHeader from '@/app/components/PageHeader';
import CalendarGrid from './components/CalendarGrid';
import CalendarHeader from './components/CalendarHeader';
import EventDetails from './components/EventDetails';
import { expandEvents, CalendarEvent, EventInstance } from './utils/expandEvents';

// Extend dayjs with isBetween plugin
dayjs.extend(isBetween);

export default function CalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(dayjs()); // Tracks the currently visible month
    const [events, setEvents] = useState<CalendarEvent[]>([]); // Loaded events from the JSON file
    const [expandedDay, setExpandedDay] = useState<string | null>(null); // Selected day for detailed view
    const [instances, setInstances] = useState<EventInstance[]>([]); // Expanded/flattened list of event occurrences

    // Load the base event patterns from JSON on mount
    useEffect(() => {
        fetch('/data/events.json')
            .then((res) => res.json())
            .then(setEvents);
    }, []);

    // Recalculate all event instances based on the current visible date range
    useEffect(() => {
        const start = currentMonth.startOf('month').startOf('week');
        const end = currentMonth.endOf('month').endOf('week');
        setInstances(expandEvents(events, start, end));
    }, [events, currentMonth]);

    // Build a flat array of all days in the visible calendar range
    const start = currentMonth.startOf('month').startOf('week');
    const end = currentMonth.endOf('month').endOf('week');
    const days = [];
    let day = start.clone();
    while (day.isBefore(end)) {
        days.push(day);
        day = day.add(1, 'day');
    }

    // Group event instances by date
    const eventsByDate = instances.reduce((map, inst) => {
        if (!map[inst.date]) map[inst.date] = [];
        map[inst.date].push(inst);
        return map;
    }, {} as Record<string, EventInstance[]>);

    return (
        <main className="min-h-screen bg-gray-950 text-white font-sans">
            <div className="container mx-auto px-4 py-6">
                {/* Header with title */}
                <PageHeader title="Calendar" />

                {/* Month selector header */}
                <CalendarHeader currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />

                {/* Weekday names row */}
                <div className="grid grid-cols-7 text-center text-xs uppercase text-orange-400 bg-blue-200/10 backdrop-blur-md border border-blue-300/10 shadow-sm font-semibold mb-2 rounded-xl">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="py-2">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Main calendar grid */}
                <CalendarGrid
                    days={days}
                    eventsByDate={eventsByDate}
                    expandedDay={expandedDay}
                    setExpandedDay={setExpandedDay}
                    currentMonth={currentMonth}
                />

                {/* Detailed events view for selected day */}
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
