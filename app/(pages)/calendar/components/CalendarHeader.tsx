'use client';

import NavButton from '@/app/components/NavButton';
import dayjs from 'dayjs';

type Props = {
    currentMonth: dayjs.Dayjs;                                      // The currently selected month
    setCurrentMonth: (fn: (d: dayjs.Dayjs) => dayjs.Dayjs) => void; // Function to update the current month
};

export default function CalendarHeader({ currentMonth, setCurrentMonth }: Props) {
    return (
        <div className="flex items-center justify-between mb-4">
            {/* Previous button */}
            <NavButton
                onClick={() => setCurrentMonth((d) => d.subtract(1, 'month'))}
                label="Previous"
                iconLeft="←"
            />

            {/* Month display */}
            <h2 className="text-xl font-semibold tracking-wide text-white drop-shadow">
                {currentMonth.format('MMMM YYYY')}
            </h2>

            {/* Next button */}
            <NavButton
                onClick={() => setCurrentMonth((d) => d.add(1, 'month'))}
                label="Next"
                iconRight="→"
            />
        </div>
    );
}
