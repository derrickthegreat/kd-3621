"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function IntegrationsSettingsPage() {
  const [discordWebhook, setDiscordWebhook] = useState("")
  const [saving, setSaving] = useState(false)

  async function saveWebhook() {
    setSaving(true)
    try {
      // Persist via your settings API (not yet implemented)
      toast.success("Saved webhook URL")
    } catch (e: any) {
      toast.error(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1">
              <h3 className="font-semibold">Discord</h3>
              <p className="text-sm text-muted-foreground">Connect a Discord webhook to receive notifications.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
              />
              <Button onClick={saveWebhook} disabled={saving || !discordWebhook}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1">
              <h3 className="font-semibold">Webhooks</h3>
              <p className="text-sm text-muted-foreground">Configure outgoing webhooks for events.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input placeholder="https://your.endpoint" />
              <Button variant="secondary" disabled>Coming soon</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
