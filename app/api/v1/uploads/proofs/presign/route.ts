import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(_req: NextRequest) {
	return NextResponse.json({ message: "Presign not implemented" }, { status: 501 })
}

export async function POST(_req: NextRequest) {
	return NextResponse.json({ message: "Presign not implemented" }, { status: 501 })
}

