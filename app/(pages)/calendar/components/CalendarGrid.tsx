'use client';

import dayjs from 'dayjs';
import { EventInstance } from '../utils';

type Props = {
    days: dayjs.Dayjs[];                            // Array of days to display in the grid
    eventsByDate: Record<string, EventInstance[]>;  // Events grouped by date (YYYY-MM-DD)
    expandedDay: string | null;                     // Currently expanded day (for details below calendar)
    setExpandedDay: (d: string | null) => void;     // Function to toggle expanded day
    currentMonth: dayjs.Dayjs;                      // Current selected month for calendar
};

export default function CalendarGrid({ days, eventsByDate, expandedDay, setExpandedDay, currentMonth }: Props) {
    return (
        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-blue-200/10 backdrop-blur-lg border border-blue-300/10 shadow-xl">
            {days.map((date) => {
                const dateStr = date.format('YYYY-MM-DD');
                const dayEvents = eventsByDate[dateStr] || [];
                const isToday = date.isSame(dayjs(), 'day');
                const isCurrentMonth = date.month() === currentMonth.month();

                return (
                    <div
                        key={dateStr}
                        onClick={() =>
                            setExpandedDay(dateStr === expandedDay ? null : dateStr)
                        }
                        className={`min-h-[100px] p-2 text-xs cursor-pointer transition-all group
                            ${isCurrentMonth
                                ? 'bg-blue-300/5 hover:bg-blue-300/10'
                                : 'bg-blue-850'}
                            ${isToday ? 'border-2 border-orange-400 shadow-md z-10 relative rounded-md' : ''}`}
                    >
                        <div className="flex justify-between items-center text-xs font-semibold">
                            <span>{date.format('ddd')}</span>
                            <span className={isToday ? 'text-orange-400' : ''}>
                                {date.date()}
                            </span>
                        </div>

                        {dayEvents.map((e, i) => (
                            <div
                                key={i}
                                className="mt-1 truncate rounded px-1 py-[2px] text-white text-[12px] group-hover:scale-[1.02] transition-transform"
                                style={{ backgroundColor: e.event.color }}
                            >
                                {e.event.title}
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
