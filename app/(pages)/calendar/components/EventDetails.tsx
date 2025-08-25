'use client';

import dayjs from 'dayjs';
import { X } from 'lucide-react';
import { EventInstance } from '../utils/expandEvents';

type Props = {
    expandedDay: string;     // The selected day to show detailed events for
    events: EventInstance[]; // List of events occurring on that day
    startTime?: string;
    endTime?: string;
    onClose: () => void;
};

export default function EventDetails({ expandedDay, events, onClose }: Props) {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-gray-950 border border-blue-300/20 rounded-2xl shadow-2xl w-full max-w-xl p-6 relative text-white">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-red-400"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-semibold tracking-wide text-orange-400 mb-4">
                    {dayjs(expandedDay).format('MMMM D, YYYY')} — Events
                </h3>

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
        </div>
    );
}
