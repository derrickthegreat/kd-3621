/**
 * Extracts up to two uppercase initials from a name, removing non-alphanumeric characters.
 * Example: "John Doe" => "JO"
 */
export function getInitials(name: string): string {
    const clean = name.replace(/[^\w]/g, ''); // Remove special characters
    return clean.slice(0, 2).toUpperCase();   // Take first two and uppercase
}

/**
 * Generates a deterministic Tailwind background color class from a seed string.
 * Uses character codes to create a hash and select a color from a fixed palette.
 */
export function getRandomColor(seed: string): string {
    const hash = Array.from(seed).reduce((a, b) => a + b.charCodeAt(0), 0);
    const colors = [
        'bg-pink-500',
        'bg-yellow-500',
        'bg-green-500',
        'bg-blue-500',
        'bg-purple-500',
        'bg-red-500',
        'bg-indigo-500',
        'bg-teal-500',
    ];
    return colors[hash % colors.length];
}
