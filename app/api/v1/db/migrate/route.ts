/**
 * API Endpoint: /api/v1/db/migrate
 *
 * Methods:
 *  - POST: Run database migrations on specified environment
 *    Required fields: environment ("dev" | "prod")
 *    Admin only endpoint
 *
 *    Example POST request:
 *    {
 *      "environment": "dev"
 *    }
 *
 *    Response:
 *    {
 *      "success": true,
 *      "message": "Migrations completed for dev",
 *      "environment": "dev"
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

    const { environment } = await request.json();

    if (!environment || !['dev', 'prod'].includes(environment)) {
      return NextResponse.json(
        { error: "Environment must be 'dev' or 'prod'" },
        { status: 400 }
      );
    }

    // Set the appropriate database URL
    const ENVIRONMENTS = {
      prod: process.env.DATABASE_URL,
      dev: process.env.DEV_DATABASE_URL,
    } as const;

    const url = ENVIRONMENTS[environment as keyof typeof ENVIRONMENTS];
    if (!url) {
      return NextResponse.json(
        { error: `${environment.toUpperCase()}_DATABASE_URL not found` },
        { status: 500 }
      );
    }

    // Temporarily set DATABASE_URL for migration
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url;

    try {
      execSync('npx prisma migrate deploy', { stdio: 'pipe' });
      
      return NextResponse.json({
        success: true,
        message: `Migrations completed for ${environment}`,
        environment,
      });
    } catch (error) {
      return NextResponse.json(
        { 
          error: "Migration failed", 
          details: error instanceof Error ? error.message : "Unknown error" 
        },
        { status: 500 }
      );
    } finally {
      // Restore original URL
      process.env.DATABASE_URL = originalUrl;
    }

  } catch (error) {
    console.error("Migration API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
