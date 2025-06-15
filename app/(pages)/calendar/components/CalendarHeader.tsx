'use client';

import dayjs from 'dayjs';

type Props = {
    currentMonth: dayjs.Dayjs;                                      // The currently selected month
    setCurrentMonth: (fn: (d: dayjs.Dayjs) => dayjs.Dayjs) => void; // Function to update the current month
};

export default function CalendarHeader({ currentMonth, setCurrentMonth }: Props) {
    return (
        <div className="flex items-center justify-between mb-4">
            {/* Button to go to the previous month */}
            <button
                onClick={() => setCurrentMonth((d) => d.subtract(1, 'month'))}
                className="px-3 py-1 rounded bg-gray-800 hover:bg-orange-500 text-sm transition-colors"
            >
                &lt; Previous
            </button>

            {/* Display current month and year */}
            <h2 className="text-xl font-semibold tracking-wide">
                {currentMonth.format('MMMM YYYY')}
            </h2>

            {/* Button to go to the next month */}
            <button
                onClick={() => setCurrentMonth((d) => d.add(1, 'month'))}
                className="px-3 py-1 rounded bg-gray-800 hover:bg-orange-500 text-sm transition-colors"
            >
                Next &gt;
            </button>
        </div>
    );
}
