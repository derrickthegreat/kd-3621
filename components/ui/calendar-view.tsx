"use client"

import * as React from "react"
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  isWithinInterval,
  differenceInCalendarDays,
} from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export type CalendarEvent = {
  id: string
  title: string
  start: Date | string
  end?: Date | string | null
  allDay?: boolean
  color?: string
  data?: any
}

export interface CalendarViewProps {
  initialMonth?: Date
  events: CalendarEvent[]
  filterText?: string
  onEventClick?: (ev: CalendarEvent) => void
  onDayClick?: (date: Date) => void
  onMonthChange?: (month: Date) => void
  className?: string
  dayCellClassName?: (date: Date) => string | undefined
  renderEventChip?: (ev: CalendarEvent) => React.ReactNode
  readOnly?: boolean
  headerClassName?: string
  badgeClassName?: (ev: CalendarEvent) => string | undefined
  view?: 'month' | 'week'
  onViewChange?: (view: 'month' | 'week') => void
  showViewToggle?: boolean
}

export function CalendarView({
  initialMonth,
  events,
  filterText,
  onEventClick,
  onDayClick,
  onMonthChange,
  className,
  dayCellClassName,
  renderEventChip,
  readOnly,
  headerClassName,
  badgeClassName,
  view: controlledView,
  onViewChange,
  showViewToggle = true,
}: CalendarViewProps) {
  const [month, setMonth] = React.useState<Date>(initialMonth ?? new Date())
  const [uncontrolledView, setUncontrolledView] = React.useState<'month' | 'week'>(controlledView ?? 'month')
  const view = controlledView ?? uncontrolledView
  const setView = (v: 'month' | 'week') => {
    if (!controlledView) setUncontrolledView(v)
    onViewChange?.(v)
  }

  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = hex.replace('#', '')
    if (m.length === 3) {
      const r = parseInt(m[0] + m[0], 16)
      const g = parseInt(m[1] + m[1], 16)
      const b = parseInt(m[2] + m[2], 16)
      return { r, g, b }
    }
    if (m.length === 6) {
      const r = parseInt(m.slice(0, 2), 16)
      const g = parseInt(m.slice(2, 4), 16)
      const b = parseInt(m.slice(4, 6), 16)
      return { r, g, b }
    }
    return null
  }

  function parseColorToRgb(color?: string | null): { r: number; g: number; b: number } | null {
    if (!color) return null
    if (color.startsWith('#')) return hexToRgb(color)
    const rgbMatch = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)
    if (rgbMatch) {
      return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) }
    }
    return null
  }

  function getContrastText(color?: string | null): 'black' | 'white' | undefined {
    const rgb = parseColorToRgb(color)
    if (!rgb) return undefined
    // YIQ formula
    const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
    return yiq >= 128 ? 'black' : 'white'
  }

  const shownMonthStart = React.useMemo(() => startOfMonth(month), [month])
  const gridDays = React.useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(month, { weekStartsOn: 0 })
      const end = endOfWeek(month, { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    }
    const start = startOfWeek(shownMonthStart, { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(shownMonthStart), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [shownMonthStart, month, view])

  const weeks = React.useMemo(() => {
    const res: Date[][] = []
    for (let i = 0; i < gridDays.length; i += 7) {
      res.push(gridDays.slice(i, i + 7))
    }
    return res
  }, [gridDays])

  const normalizedEvents = React.useMemo(() => {
    const q = (filterText ?? "").trim().toLowerCase()
    const norm = (d: Date | string | null | undefined) => (typeof d === "string" ? parseISO(d) : d || null)
    const res = (events || []).map((e) => ({
      ...e,
      start: norm(e.start) as Date,
      end: norm(e.end) as Date | null,
    }))
    if (!q) return res
    return res.filter((e) => e.title.toLowerCase().includes(q))
  }, [events, filterText])

  function gotoPrevMonth() {
    const next = view === 'week' ? addWeeks(month, -1) : addMonths(month, -1)
    setMonth(next)
    onMonthChange?.(next)
  }
  function gotoNextMonth() {
    const next = view === 'week' ? addWeeks(month, 1) : addMonths(month, 1)
    setMonth(next)
    onMonthChange?.(next)
  }
  function gotoToday() {
    const next = new Date()
    setMonth(next)
    onMonthChange?.(next)
  }

  type WeekSegment = { startCol: number; endCol: number; line: number; ev: CalendarEvent }

  function computeWeekSegments(weekDays: Date[]): WeekSegment[] {
    const weekStart = weekDays[0]
    const weekEnd = weekDays[6]
    // events that overlap this week
    const overlapping = normalizedEvents.filter((e) => {
      const s = e.start as Date
      const eend = (e.end as Date | null) ?? s
      return s <= weekEnd && eend >= weekStart
    })

    // Prepare segments clipped to the week boundaries
    const raw = overlapping
      .map((e) => {
        const s = e.start as Date
        const eend = (e.end as Date | null) ?? s
        const segStart = s > weekStart ? s : weekStart
        const segEnd = eend < weekEnd ? eend : weekEnd
        const startCol = Math.max(0, Math.min(6, differenceInCalendarDays(segStart, weekStart)))
        const endCol = Math.max(startCol, Math.min(6, differenceInCalendarDays(segEnd, weekStart)))
        return { startCol, endCol, ev: e }
      })
      // sort by start then by length descending to improve packing
      .sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol))

    // Greedy packing into lines
    const lines: boolean[][] = []
    const placed: WeekSegment[] = []
    for (const seg of raw) {
      let line = 0
      for (; line < lines.length; line++) {
        const occupied = lines[line]
        let free = true
        for (let c = seg.startCol; c <= seg.endCol; c++) {
          if (occupied[c]) { free = false; break }
        }
        if (free) break
      }
      if (line === lines.length) {
        lines.push(Array(7).fill(false))
      }
      for (let c = seg.startCol; c <= seg.endCol; c++) {
        lines[line][c] = true
      }
      placed.push({ startCol: seg.startCol, endCol: seg.endCol, line, ev: seg.ev })
    }
    return placed
  }

  return (
    <div className={cn("w-full", className)}>
  <div className={cn("flex items-center justify-between px-2 sm:px-4 py-2", headerClassName)}>
        <div className="text-xl font-semibold tracking-tight">
          {view === 'week'
            ? `${format(startOfWeek(month, { weekStartsOn: 0 }), 'MMM d')} – ${format(endOfWeek(month, { weekStartsOn: 0 }), 'd, yyyy')}`
            : format(shownMonthStart, "MMMM yyyy")}
        </div>
        <div className="flex items-center gap-2">
          {showViewToggle && (
            <div className="flex items-center rounded-md border bg-background p-0.5">
              <Button variant={view === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setView('month')}>Month</Button>
              <Button variant={view === 'week' ? 'default' : 'ghost'} size="sm" onClick={() => setView('week')}>Week</Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={gotoToday}>Today</Button>
          <Button variant="outline" size="icon" onClick={gotoPrevMonth} aria-label="Previous period">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={gotoNextMonth} aria-label="Next period">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <div className="grid grid-cols-7 divide-x bg-muted/40 text-xs font-medium text-muted-foreground">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-2 text-center uppercase tracking-wide">
              {format(addMonths(startOfWeek(new Date(), { weekStartsOn: 0 }), 0).setDate(i + 1), "EEE").slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="divide-y">
          {weeks.map((week, wi) => {
            const segments = computeWeekSegments(week)
            return (
              <div key={wi} className="relative">
                {/* Day grid for this week */}
                <div className="grid grid-cols-7 divide-x">
                  {week.map((d) => {
                    const outside = view === 'month' ? !isSameMonth(d, shownMonthStart) : false
                    const today = isToday(d)
                    return (
                      <div
                        key={d.toISOString()}
                        onClick={() => { if (!readOnly) onDayClick?.(d) }}
                        className={cn(
                          "min-h-[120px] bg-background p-2 transition-colors",
                          !readOnly && "cursor-pointer hover:bg-muted/30",
                          outside && "bg-muted/20 text-muted-foreground",
                          dayCellClassName?.(d)
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className={cn("text-xs", today && "font-semibold text-primary")}>{format(d, "d")}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Events overlay for this week */}
                {/* overlay uses small gutters so bars don't touch cell borders */}
                <div className="pointer-events-none absolute inset-x-0 top-[1.75rem] bottom-2 grid grid-cols-7 gap-1 px-3">
                  {segments.map((seg, idx) => {
                    const span = seg.endCol - seg.startCol + 1
                    const ev = seg.ev
                    const textColor = getContrastText((ev as any).color)
                    return (
                      <button
                        key={`${wi}-${idx}-${ev.id}`}
                        className={cn(
                          "pointer-events-auto h-6 overflow-hidden rounded-md border text-left text-[11px] leading-6",
                          textColor === 'white' ? 'text-white' : textColor === 'black' ? 'text-black' : 'text-foreground'
                        , badgeClassName?.(ev)
                        )}
                        style={{
                          gridColumn: `${seg.startCol + 1} / span ${span}`,
                          marginTop: seg.line * 24,
                          marginLeft: seg.startCol === 0 ? 2 : 0,
                          marginRight: seg.endCol === 6 ? 2 : 0,
                          backgroundColor: (ev as any).color || undefined,
                          borderColor: (ev as any).color || undefined,
                        }}
                        onClick={(e) => { e.stopPropagation(); onEventClick?.(ev) }}
                        aria-label={typeof ev.title === 'string' ? ev.title : 'Event'}
                      >
                        <span className="inline-flex items-center gap-2 px-2">
                          <span className="truncate">{renderEventChip ? renderEventChip(ev) : ev.title}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
