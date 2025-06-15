type SortIconProps = {
    active: boolean; // Whether this icon is for the currently sorted column
    asc: boolean;    // Whether the sorting is ascending (true) or descending (false)
};

export default function SortIcon({ active, asc }: SortIconProps) {
    // If the column is not actively sorted, show a neutral double arrow
    if (!active) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="m7 15 5 5 5-5"></path> {/* Downward chevron */}
                <path d="m7 9 5-5 5 5"></path>   {/* Upward chevron */}
            </svg>
        );
    }

    // Active sorting icons
    return asc ? (
        // Ascending arrow (up)
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="m5 12 7-7 7 7"></path>
        </svg>
    ) : (
        // Descending arrow (down)
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="m19 12-7 7-7-7"></path>
        </svg>
    );
}
