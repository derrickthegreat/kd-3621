import dayjs from 'dayjs';

/**
 * Describes a recurrence pattern for an event.
 */
export type EventPattern = {
    startDate: string; // Date the pattern starts (e.g., "2024-01-01")
    frequency: 'four-weeks' | 'eight-weeks' | string; // Recurrence frequency
    duration: number; // Duration in days the event lasts
};

/**
 * Describes a calendar event with one or more recurrence patterns.
 */
export type CalendarEvent = {
    title: string; // Event title (e.g., "KvK Training")
    description: string; // Optional event description
    color: string; // Color for UI display (e.g., "#FF0000")
    pattern: EventPattern[]; // One or more recurrence patterns
};

/**
 * A single instance of an event on a specific date.
 */
export type EventInstance = {
    date: string; // ISO string like "2024-01-29"
    event: CalendarEvent; // The event this instance belongs to
};

/**
 * Maps known frequency strings to interval in days.
 */
const frequencyToDays = {
    'four-weeks': 28,
    'eight-weeks': 56,
};

/**
 * Expands recurrence-based events into individual dated instances
 * within a given range [start, end].
 *
 * @param events - List of CalendarEvents to expand
 * @param start - Start of the visible calendar window
 * @param end - End of the visible calendar window
 * @returns Array of dated event instances
 */
export function expandEvents(
    events: CalendarEvent[],
    start: dayjs.Dayjs,
    end: dayjs.Dayjs
): EventInstance[] {
    const result: EventInstance[] = [];

    for (const event of events) {
        for (const pat of event.pattern) {
            let current = dayjs(pat.startDate);
            const interval =
                pat.frequency in frequencyToDays
                    ? frequencyToDays[pat.frequency as keyof typeof frequencyToDays]
                    : 0;

            while (current.isBefore(end)) {
                for (let i = 0; i < pat.duration; i++) {
                    const eventDate = current.add(i, 'day');
                    if (eventDate.isBetween(start.subtract(1, 'day'), end)) {
                        result.push({
                            date: eventDate.format('YYYY-MM-DD'),
                            event,
                        });
                    }
                }
                current = current.add(interval, 'day');
                if (interval === 0) break;
            }
        }
    }

    return result;
}
