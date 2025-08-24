"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function UploadScan() {
    const [file, setFile] = useState<File | null>(null)
    const [busy, setBusy] = useState(false)

    async function handleUpload() {
        if (!file) return
        setBusy(true)
        try {
            // Hook to an API for OCR/parsing later
            await new Promise((r) => setTimeout(r, 600))
            toast.success("Scan uploaded (stub)")
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="w-full my-4 space-y-4 px-4 md:px-6 lg:px-8">
            <Card>
                <CardContent className="p-4 space-y-3">
                    <div>
                        <h3 className="font-semibold">Upload a Scan</h3>
                        <p className="text-sm text-muted-foreground">Commander or scout report image/PDF.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        <Button onClick={handleUpload} disabled={!file || busy}>Upload</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}