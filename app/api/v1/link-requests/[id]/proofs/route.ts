import { NextRequest, NextResponse } from "next/server"
import access from "@/services/AccessControlService"
import { prisma } from "@/lib/db/prismaUtils"

export async function GET(req: NextRequest) {
  const unauthorized = await access.requireReadAccess(req)
  if (unauthorized) return unauthorized
  const parsed = new URL(req.url)
  const id = parsed.pathname.split('/').slice(-2, -1)[0]
  const proofs = await prisma.linkRequestProof.findMany({ where: { requestId: id }, orderBy: { uploadedAt: 'desc' } })
  return NextResponse.json({ proofs })
}

export async function POST(req: NextRequest) {
  const unauthorized = await access.requireWriteAccess(req)
  if (unauthorized) return unauthorized
  const session = await access.getSessionInfo(req)
  const userId = session?.userId
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const parsed = new URL(req.url)
  const id = parsed.pathname.split('/').slice(-2, -1)[0]
  const body = await req.json().catch(()=>({}))
  const { url: proofUrl, type, caption } = body || {}
  if (!proofUrl) return NextResponse.json({ message: 'url required' }, { status: 400 })

  const created = await prisma.linkRequestProof.create({ data: { requestId: id, url: String(proofUrl), type, caption, uploadedById: userId } })
  return NextResponse.json({ proof: created })
}