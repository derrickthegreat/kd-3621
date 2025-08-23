"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

export interface DataTableProps<TData, TValue = unknown> {
  data: TData[]
  columns: ColumnDef<TData, TValue>[]
  loading?: boolean
  error?: string | null
  pageSize?: number
  initialSorting?: SortingState
  searchable?: boolean
  searchKeys?: (keyof TData | string)[]
  searchPlaceholder?: string
  columnVisibilityControls?: boolean
  excludeFromVisibilityToggle?: string[]
  extraToolbarActions?: React.ReactNode
}

export function DataTable<TData, TValue = unknown>({
  data,
  columns,
  loading,
  error,
  pageSize = 10,
  initialSorting,
  searchable = true,
  searchKeys = [],
  searchPlaceholder = "Search...",
  columnVisibilityControls = true,
  excludeFromVisibilityToggle = ["actions"],
  extraToolbarActions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting ?? [])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [pageIndex, setPageIndex] = React.useState(0)
  const [search, setSearch] = React.useState("")

  const debouncedSearch = useDebounced(search, 250)

  const filtered = React.useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q || !searchable || !searchKeys.length) return data
    return data.filter((row: any) =>
      searchKeys.some((key) => String(row?.[key as any] ?? "").toLowerCase().includes(q))
    )
  }, [data, debouncedSearch, searchable, searchKeys])

  const table = useReactTable({
    data: filtered as TData[],
    columns,
    state: { sorting, columnVisibility, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? (updater as any)({ pageIndex, pageSize }) : updater
      setPageIndex(next.pageIndex ?? 0)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize, pageIndex: 0 } },
  })

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4">
        <div className="flex items-center gap-2 w-full md:w-80">
          {searchable ? (
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {columnVisibilityControls ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Columns</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table.getAllLeafColumns().map((column) => (
                  excludeFromVisibilityToggle.includes(column.id) ? null : (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    >
                      {String(column.columnDef.header ?? column.id)}
                    </DropdownMenuCheckboxItem>
                  )
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {extraToolbarActions}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className={header.id === "actions" ? "text-right" : ""}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-red-600">{error}</TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.id === "actions" ? "text-right" : ""}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6 text-muted-foreground">
                  No results
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-2 px-4">
        <div className="text-sm text-muted-foreground">
          {table.getRowModel().rows.length} of {filtered.length} row(s)
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
