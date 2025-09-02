/**
 * API Endpoint: /api/v1/db/generate
 *
 * Methods:
 *  - POST: Generate Prisma client
 *    Admin only endpoint
 *
 *    Example POST request:
 *    {}
 *
 *    Response:
 *    {
 *      "success": true,
 *      "message": "Prisma client generated successfully"
 *    }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDBClient } from "@/lib/db/clients";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and check if they're admin
    const prodClient = getDBClient('production');
    const user = await prodClient.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      execSync('npx prisma generate', { stdio: 'pipe' });
      
      return NextResponse.json({
        success: true,
        message: "Prisma client generated successfully",
      });
    } catch (error) {
      return NextResponse.json(
        { 
          error: "Client generation failed", 
          details: error instanceof Error ? error.message : "Unknown error" 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
