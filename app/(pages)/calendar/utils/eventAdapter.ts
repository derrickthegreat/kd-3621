import { CalendarEvent } from './expandEvents';

/**
 * Database event type - what we get from the API
 */
export type DatabaseEvent = {
  id: string;
  name: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  closedAt?: string;
  isArchived: boolean;
};

/**
 * Transforms database events into the format expected by the calendar component
 */
export function transformDatabaseEventsToCalendarEvents(
  databaseEvents: DatabaseEvent[]
): CalendarEvent[] {
  return databaseEvents
    .filter(event => !event.isArchived) // Filter out archived events
    .map(event => {
      const startDate = new Date(event.startDate);
      const endDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
      
      // Calculate duration in days
      const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      
      return {
        title: event.name,
        description: event.description || '',
        color: event.color || '#3B82F6', // Default blue color
        pattern: [
          {
            startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            frequency: 'once', // Database events are single occurrence
            duration: duration,
            startTime: undefined, // Could extract from startDate if needed
            endTime: undefined    // Could extract from endDate if needed
          }
        ]
      };
    });
}