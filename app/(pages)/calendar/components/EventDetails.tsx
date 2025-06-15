'use client';

import dayjs from 'dayjs';
import { CalendarEvent } from '../utils';

type Props = {
    expandedDay: string;     // The selected day to show detailed events for
    events: CalendarEvent[]; // List of events occurring on that day
};

export default function EventDetails({ expandedDay, events }: Props) {
    return (
        <div className="mt-6 border border-gray-700 bg-gray-800 rounded-lg p-4">
            {/* Header showing the selected date */}
            <h3 className="text-lg font-semibold mb-2">
                {dayjs(expandedDay).format('MMMM D, YYYY')} — Events
            </h3>

            {/* Render list of events for the selected day */}
            {events.map((e, i) => (
                <div key={i} className="mb-2">
                    <div className="font-bold text-white">{e.title}</div>
                    <div className="text-sm text-gray-300">{e.description}</div>
                </div>
            ))}
        </div>
    );
}
