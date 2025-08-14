/**
 * Formats a numeric value with thousands separators (e.g., 1234567 → "1,234,567").
 * If the input is not a number, returns a dash.
 */
export function formatNumber(value: any): string {
    const num = Number(value);
    return isNaN(num) ? '—' : num.toLocaleString('en-US');
}

/**
 * Formats a numeric value as a percentage string (e.g., 85 → "85%").
 * If the input is not a number, returns a dash.
 */
export function formatPercentage(value: any): string {
    const num = Number(value);
    return isNaN(num) ? '—' : `${num}%`;
}
