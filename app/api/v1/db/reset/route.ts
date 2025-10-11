/**
 * API Endpoint: /api/v1/db/reset
 *
 * Methods:
 *  - POST: Reset database on specified environment (DESTRUCTIVE OPERATION)
 *    Required fields: environment ("dev" | "prod"), confirmation ("RESET")
 *    Admin only endpoint
 *
 *    Example POST request:
 *    {
 *      "environment": "dev",
 *      "confirmation": "RESET"
 *    }
 *
 *    Response:
 *    {
 *      "success": true,
 *      "message": "Database reset completed for dev",
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

    const { environment, confirmation } = await request.json();

    if (!environment || !['dev', 'prod'].includes(environment)) {
      return NextResponse.json(
        { error: "Environment must be 'dev' or 'prod'" },
        { status: 400 }
      );
    }

    if (confirmation !== "RESET") {
      return NextResponse.json(
        { error: "Confirmation must be 'RESET' to proceed with this destructive operation" },
        { status: 400 }
      );
    }

    // Extra safety check for production
    if (environment === 'prod') {
      return NextResponse.json(
        { error: "Production database reset is not allowed via API for safety" },
        { status: 403 }
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

    // Temporarily set DATABASE_URL for reset
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url;

    try {
      execSync('npx prisma migrate reset --force', { stdio: 'pipe' });
      
      return NextResponse.json({
        success: true,
        message: `Database reset completed for ${environment}`,
        environment,
      });
    } catch (error) {
      return NextResponse.json(
        { 
          error: "Reset failed", 
          details: error instanceof Error ? error.message : "Unknown error" 
        },
        { status: 500 }
      );
    } finally {
      // Restore original URL
      process.env.DATABASE_URL = originalUrl;
    }

  } catch (error) {
    console.error("Reset API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
