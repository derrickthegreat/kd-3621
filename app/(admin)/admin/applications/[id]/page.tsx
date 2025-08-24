"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { toast, Toaster } from "sonner";

type Commander = { commander: { id: string; name: string; icon?: string } };
type Equipment = {
  equipment: { id: string; name: string; rarity?: string; icon?: string };
  iconicTier?: number | null;
  isCrit?: boolean;
};

type AppDetail = {
  id: string;
  status: string;
  eventId: string;
  player: {
    id: string;
    name: string;
    rokId: string;
    alliance?: { id: string; name: string; tag?: string | null } | null;
    stats?: { power?: number | null }[] | null;
    applications?:
      | {
          id: string;
          status: string;
          createdAt: string;
          event?: { id: string; name: string } | null;
          EventRanking?: { rank: number | null }[];
        }[]
      | null;
  };
  commanders: Commander[];
  equipment: Equipment[];
  createdAt: string;
  EventRanking?: { rank: number | null }[];
  event?: { id: string; name?: string; startDate?: string; endDate?: string; EventRanking?: { rank: number }[] };
};

export default function ApplicationDetailPage() {
  const { getToken } = useAuth();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<AppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rank, setRank] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<'NEW' | 'REVIEWING' | 'APPROVED' | 'DECLINED' | 'CLOSED'>("NEW");

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) throw new Error("Unauthorized");
        const res = await fetch(`/api/v1/applications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.message || "Failed to load application")
        if (!cancel) {
          const app = body as AppDetail
          setData(app)
          const existingRank = app?.EventRanking && app.EventRanking[0]?.rank
          if (existingRank && Number.isFinite(existingRank)) {
            setRank(String(existingRank))
          }
          if (app?.status) setSelectedStatus(app.status as any)
        }
      } catch (e: any) {
        if (!cancel) setError(e.message || "Error");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [getToken, id]);

  // Clear rank locally when switching to a status that shouldn't have rank
  useEffect(() => {
    if (selectedStatus !== 'APPROVED' && selectedStatus !== 'REVIEWING') {
      setRank("")
    }
  }, [selectedStatus])

  async function updateStatus(status: 'NEW' | 'REVIEWING' | 'APPROVED' | 'DECLINED' | 'CLOSED') {
    if (!id) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Unauthorized");
      const res = await fetch(`/api/v1/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          rank: (status === 'APPROVED' || status === 'REVIEWING') ? (rank ? Number(rank) : undefined) : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Failed to update status");
      setData((prev) => {
        const next = body.application as AppDetail
        // If status shouldn't have rank, clear local rank and EventRanking
        if (status !== 'APPROVED' && status !== 'REVIEWING') {
          setRank("")
          if (next) {
            next.EventRanking = []
          }
        }
        return next
      });
      const nextApp = (body.application as AppDetail)
      if (nextApp?.status) setSelectedStatus(nextApp.status as any)
      toast.success(`Application status updated to ${nextApp.status}.`)
    } catch (e: any) {
      toast.error(e.message || "Error updating status");
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Application Details</h2>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/admin/players/${data.player.id}`}>Player</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/admin/events/${data.eventId}`}>Event</Link>
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : data ? (
        <>
          {/* Event summary */}
          {data.event && (
            <div className="text-sm text-muted-foreground">
              <span className="mr-1">Event:</span>
              <span className="font-medium text-foreground mr-2">{data.event.name || "Unnamed Event"}</span>
              {data.event.startDate && (
                <>
                  <span className="mx-1">•</span>
                  <span>
                    {new Date(data.event.startDate).toLocaleDateString()} 
                    {data.event.endDate ? ` – ${new Date(data.event.endDate).toLocaleDateString()}` : ""}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <ApplicationStatusBadge status={data.status} />
            <div className="flex-1" />
            <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
              <SelectTrigger className="w-[160px]" aria-label="Change status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="REVIEWING">Reviewing</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            {(selectedStatus === 'APPROVED' || selectedStatus === 'REVIEWING') && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Event Rank:</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Rank"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="w-24"
                />
              </div>
            )}
            <Button
              size="sm"
              variant="default"
              onClick={() => updateStatus(selectedStatus)}
              disabled={(selectedStatus === 'APPROVED' && (!rank || Number(rank) <= 0))}
            >
              Save
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player Summary */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-md font-bold">{data.player?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <strong>ID:</strong>&nbsp;{data.player?.rokId}
                    </div>
                  </div>
                  {Array.isArray(data.EventRanking) && data.EventRanking[0]?.rank ? (
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
                      Rank {data.EventRanking[0].rank}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-muted-foreground flex flex-col gap-1 mb-5">
                  {data.player?.alliance && (
                    <div>
                      <strong>Alliance: </strong>
                      {data.player.alliance.tag
                        ? `[${data.player.alliance.tag}] `
                        : ""}
                      {data.player.alliance.name}
                    </div>
                  )}
                  {Array.isArray(data.player?.stats) &&
                    data.player.stats.length > 0 && (
                      <div>
                        <strong>Power: </strong>
                        {Math.max(
                          ...data.player.stats.map((s) => Number(s?.power ?? 0))
                        ).toLocaleString()}
                      </div>
                    )}
                </div>

                {/* Application history */}
                <div className="pt-2">
                  <h4 className="font-medium text-sm">Past applications</h4>
                  {Array.isArray(data.player?.applications) &&
                  data.player.applications.length ? (
                    <ul className="mt-1 space-y-1">
                      {data.player.applications.map((a) => (
                        <li
                          key={a.id}
                          className="text-sm text-muted-foreground flex items-center justify-between gap-2"
                        >
                          <span className="truncate">
                            {a.event?.name || "Event"} — {a.status}
                          </span>
                          <span className="text-xs">
                            {a.EventRanking?.[0]?.rank
                              ? `Rank ${a.EventRanking[0].rank}`
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No prior applications.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold">Commanders</h3>
                  {data.commanders?.length ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {data.commanders.map((c) => (
                        <li key={c.commander.id}>{c.commander.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No commanders submitted.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold">Equipment</h3>
                  {data.equipment?.length ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {data.equipment.map((e, idx) => (
                        <li key={idx}>
                          {e.equipment.name}
                          {typeof e.iconicTier === "number"
                            ? ` — Iconic ${e.iconicTier}`
                            : ""}
                          {e.isCrit ? " — Crit" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No equipment submitted.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ApplicationStatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase()
  const tone =
    s === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : s === 'DECLINED' ? 'bg-rose-50 text-rose-700 border-rose-200'
    : s === 'REVIEWING' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : s === 'CLOSED' ? 'bg-slate-100 text-slate-700 border-slate-200'
    : 'bg-sky-50 text-sky-700 border-sky-200' // NEW / default
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}>
      {s}
    </span>
  )
}
