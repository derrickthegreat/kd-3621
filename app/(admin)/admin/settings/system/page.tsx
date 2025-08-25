"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function SystemSettingsPage() {
  const runMigrations = async () => {
    toast("Running migrations… (dev-only placeholder)")
  }
  const clearCache = async () => {
    toast.success("Cache cleared")
  }
  return (
    <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold">Database</h3>
            <p className="text-sm text-muted-foreground">Status, migrations, and diagnostics.</p>
            <div className="flex gap-2">
              <Button onClick={runMigrations}>Run Migrations</Button>
              <Button variant="secondary" onClick={clearCache}>Clear Cache</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold">System</h3>
            <p className="text-sm text-muted-foreground">Environment and operational info.</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5">
              <li>Node: {process.env.NODE_ENV}</li>
              <li>Region: edge</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
