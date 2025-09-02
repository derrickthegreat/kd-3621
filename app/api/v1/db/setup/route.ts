/**
 * API Endpoint: /api/v1/db/setup
 *
 * Methods:
 *  - POST: Setup both environments (generate client, migrate, and seed both dev and prod)
 *    Admin only endpoint
 *
 *    Example POST request:
 *    {}
 *
 *    Response:
 *    {
 *      "success": true,
 *      "message": "Both environments setup completed",
 *      "steps": [
 *        { "step": "generate", "status": "success" },
 *        { "step": "migrate_dev", "status": "success" },
 *        { "step": "migrate_prod", "status": "success" },
 *        { "step": "seed_dev", "status": "success" },
 *        { "step": "seed_prod", "status": "success" }
 *      ]
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

    const ENVIRONMENTS = {
      prod: process.env.DATABASE_URL,
      dev: process.env.DEV_DATABASE_URL,
    };

    const steps = [];
    const originalUrl = process.env.DATABASE_URL;

    try {
      // Step 1: Generate client
      execSync('npx prisma generate', { stdio: 'pipe' });
      steps.push({ step: "generate", status: "success" });

      // Step 2: Migrate dev
      process.env.DATABASE_URL = ENVIRONMENTS.dev;
      execSync('npx prisma migrate deploy', { stdio: 'pipe' });
      steps.push({ step: "migrate_dev", status: "success" });

      // Step 3: Migrate prod
      process.env.DATABASE_URL = ENVIRONMENTS.prod;
      execSync('npx prisma migrate deploy', { stdio: 'pipe' });
      steps.push({ step: "migrate_prod", status: "success" });

      // Step 4: Seed dev
      process.env.DATABASE_URL = ENVIRONMENTS.dev;
      try {
        execSync('npx prisma db seed', { stdio: 'pipe' });
        steps.push({ step: "seed_dev", status: "success" });
      } catch (error) {
        steps.push({ step: "seed_dev", status: "skipped", reason: "No seed file or seed failed" });
      }

      // Step 5: Seed prod
      process.env.DATABASE_URL = ENVIRONMENTS.prod;
      try {
        execSync('npx prisma db seed', { stdio: 'pipe' });
        steps.push({ step: "seed_prod", status: "success" });
      } catch (error) {
        steps.push({ step: "seed_prod", status: "skipped", reason: "No seed file or seed failed" });
      }

      return NextResponse.json({
        success: true,
        message: "Both environments setup completed",
        steps,
      });

    } catch (error) {
      return NextResponse.json(
        { 
          error: "Setup failed", 
          details: error instanceof Error ? error.message : "Unknown error",
          completedSteps: steps
        },
        { status: 500 }
      );
    } finally {
      // Restore original URL
      process.env.DATABASE_URL = originalUrl;
    }

  } catch (error) {
    console.error("Setup API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
