'use client';

import dayjs from 'dayjs';
import { EventInstance } from '../utils/expandEvents';

type Props = {
    expandedDay: string;     // The selected day to show detailed events for
    events: EventInstance[]; // List of events occurring on that day
    startTime?: string;
    endTime?: string
};

export default function EventDetails({ expandedDay, events }: Props) {
    return (
        <div className="mt-6 p-5 rounded-2xl bg-blue-200/10 backdrop-blur-md border border-blue-300/20 shadow-xl text-white">
            {/* Header with icon and formatted date */}
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold tracking-wide text-orange-400">
                    {dayjs(expandedDay).format('MMMM D, YYYY')} — Events
                </h3>
            </div>

            {events.length === 0 ? (
                <p className="text-sm text-blue-100">No events scheduled for this day.</p>
            ) : (
                <div className="space-y-4">
                    {events.map((e, i) => (
                        <div
                            key={i}
                            className="p-4 rounded-xl bg-blue-300/10 hover:bg-blue-300/20 transition-colors shadow-md"
                        >
                            <span
                                className="inline-block px-2 py-1 text-xs font-semibold rounded text-white mb-2"
                                style={{ backgroundColor: e.event.color }}
                            >
                                {e.event.title}
                            </span>
                            <p className="text-sm text-blue-100">
                                {e.event.description}
                                {e.startTime && e.endTime && (
                                    <span className="block mt-1 text-xs text-blue-300">
                                        {e.startTime} – {e.endTime} UTC
                                    </span>
                                )}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
