import { NextRequest, NextResponse } from "next/server"
import access from "@/services/AccessControlService"
import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"

export const runtime = "nodejs"

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
])
const MAX_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const unauthorized = await access.requireWriteAccess(req)
  if (unauthorized) return unauthorized

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ message: "Invalid form data" }, { status: 400 })
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ message: "file is required" }, { status: 400 })

  // Validate type and size
  const type = (file.type || "").toLowerCase()
  if (!ALLOWED_MIME.has(type)) {
    return NextResponse.json({ message: "Unsupported file type" }, { status: 400 })
  }
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.byteLength > MAX_BYTES) {
    return NextResponse.json({ message: "File too large" }, { status: 400 })
  }

  // Determine extension
  const extFromName = (file.name?.split(".").pop() || "").toLowerCase()
  const extFromType = type.split("/")[1] || ""
  const ext = (extFromName || extFromType || "bin").replace(/[^a-z0-9]/g, "")

  // Build destination path under public/proofs/YYYY/MM
  const now = new Date()
  const year = String(now.getUTCFullYear())
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  const relDir = path.posix.join("proofs", year, month)
  const fileName = `${randomUUID()}.${ext}`
  const relPath = path.posix.join(relDir, fileName)
  const absDir = path.join(process.cwd(), "public", relDir)
  const absPath = path.join(process.cwd(), "public", relPath)

  await fs.mkdir(absDir, { recursive: true })
  await fs.writeFile(absPath, buf)

  // Return the public URL path
  return NextResponse.json({ url: `/${relPath}` })
}
