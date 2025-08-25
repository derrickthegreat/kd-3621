"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StatusMessage from "@/components/ui/status-message";
import { CommanderCombobox } from "@/components/admin/commanders/commander-combobox";
import { toast } from "sonner";

type Commander = { id: string; name: string; iconUrl: string };

export interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [commanderAvatarId, setCommanderAvatarId] = useState<string | null>(null);
  const [socials, setSocials] = useState<{ [k: string]: string }>({});
  const [commanders, setCommanders] = useState<Commander[]>([]);

  const previewUrl = useMemo(() => {
    const picked = commanders.find((c) => c.id === commanderAvatarId)?.iconUrl;
    return avatarUrl || picked || null;
  }, [avatarUrl, commanderAvatarId, commanders]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await fetch("/api/v1/users/me").then((r) => r.json());
        if (!cancelled) {
          setUsername(me?.profile?.username || "");
          setDisplayName(me?.profile?.displayName || "");
          setAvatarUrl(me?.profile?.avatarUrl || null);
          setCommanderAvatarId(me?.profile?.commanderAvatarId || null);
          setSocials(me?.profile?.socials || {});
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load profile");
      }
      try {
        const data = await fetch("/api/v1/commander").then((r) => r.json());
        if (!cancelled) setCommanders((data || []).map((c: any) => ({ id: c.id, name: c.name, iconUrl: c.iconUrl })));
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true };
  }, [open]);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    const u = (username || "").trim();
    if (!u) {
      setSaving(false);
      const msg = "Username is required";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (/\s/.test(u)) {
      setSaving(false);
      const msg = "Username cannot contain spaces";
      setError(msg);
      toast.error(msg);
      return;
    }
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, displayName, avatarUrl, commanderAvatarId, socials }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "Failed to save settings");
      toast.success("Settings saved");
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message || "Failed to save";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const initials = (displayName || username || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
        </DialogHeader>

        {error && <StatusMessage message={error} isError />}
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <form onSubmit={save} className="space-y-8">
            {/* Profile section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="no spaces" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Photo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      {previewUrl ? <AvatarImage src={previewUrl} alt={displayName || username} /> : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Custom avatar URL" value={avatarUrl || ''} onChange={(e) => setAvatarUrl(e.target.value || null)} />
                      <div className="flex items-center md:justify-end gap-2">
                        <div className="min-w-0 w-full md:w-auto">
                          <CommanderCombobox
                            value={commanderAvatarId || undefined}
                            onChange={(v) => setCommanderAvatarId(v)}
                            options={commanders}
                            placeholder="Choose commander icon"
                            disabled={loading}
                          />
                        </div>
                        {commanderAvatarId || avatarUrl ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setCommanderAvatarId(null); setAvatarUrl(null); }}
                          >
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Socials section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Socials</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Discord (e.g., user#0001)" value={socials.discord || ''} onChange={(e) => setSocials({ ...socials, discord: e.target.value })} />
                <Input placeholder="Twitter/X" value={socials.twitter || ''} onChange={(e) => setSocials({ ...socials, twitter: e.target.value })} />
                <Input placeholder="Reddit" value={socials.reddit || ''} onChange={(e) => setSocials({ ...socials, reddit: e.target.value })} />
                <Input placeholder="YouTube" value={socials.youtube || ''} onChange={(e) => setSocials({ ...socials, youtube: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-500" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
