/**
 * Sorts an array of objects by a specified key in ascending or descending order.
 *
 * @param array - The array of objects to sort
 * @param key - The key within each object to sort by
 * @param asc - Whether to sort in ascending order (default is true)
 * @returns A new sorted array
 */
export function sortArray<T>(array: T[], key: keyof T, asc: boolean = true): T[] {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return asc ? aVal - bVal : bVal - aVal;
        }

        return 0;
    });
}
