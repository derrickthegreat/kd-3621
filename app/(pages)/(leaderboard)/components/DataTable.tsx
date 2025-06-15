'use client';

import Image from 'next/image';
import SortIcon from './SortIcon';

// Type definition for each column in the table
export type DataTableColumn<T> = {
    key: keyof T | string;                     // The key in the data object this column refers to
    label: string;                             // The column header label
    icon?: string;                             // Optional icon to display next to the label
    sortable?: boolean;                        // Indicates if the column is sortable
    render?: (row: T) => React.ReactNode;      // Optional custom render function for cell content
};

// Props for the DataTable component
type Props<T> = {
    data: T[];                                 // Array of data to display in the table
    columns: DataTableColumn<T>[];             // Column definitions
    sortKey: string;                           // Current column used for sorting
    sortAsc: boolean;                          // Sorting order (ascending or descending)
    onSort: (key: string) => void;             // Function to call when a sortable column is clicked
    getRowKey: (row: T) => string | number;    // Function to get a unique key for each row
};

// Generic DataTable component
export default function DataTable<T>({
    data,
    columns,
    sortKey,
    sortAsc,
    onSort,
    getRowKey,
}: Props<T>) {
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto whitespace-nowrap">
            <table className="min-w-full text-sm">
                {/* Table header */}
                <thead className="uppercase text-[#e19513] text-xs bg-gray-900 border-b border-gray-700">
                    <tr>
                        {columns.map(({ key, label, icon, sortable }) => (
                            <th
                                key={String(key)}
                                onClick={() => sortable && onSort(String(key))}
                                className={`p-3 text-left border border-gray-800 cursor-pointer ${key === '#' ? 'w-10' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    {icon && <Image src={icon} alt={`${label} icon`} width={16} height={16} />}
                                    {label}
                                    {sortable && <SortIcon active={sortKey === key} asc={sortAsc} />}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Table body */}
                <tbody className="bg-gray-950">
                    {data.map((row) => (
                        <tr
                            key={getRowKey(row)}
                            className="border-b border-gray-800 hover:bg-gray-700/30 transition-colors"
                        >
                            {columns.map(({ key, render }) => (
                                <td key={String(key)} className="p-3 border border-gray-800">
                                    {render ? render(row) : String(row[key as keyof T])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
