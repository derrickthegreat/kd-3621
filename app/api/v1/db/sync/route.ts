/**
 * API Endpoint: /api/v1/db/sync
 *
 * Methods:
 *  - POST: Sync data between databases
 *    Admin only endpoint
 *
 *    Full database sync:
 *    {
 *      "from": "dev" | "prod",
 *      "to": "dev" | "prod"
 *    }
 *
 *    Single table sync:
 *    {
 *      "tableName": "user",
 *      "from": "dev" | "prod", 
 *      "to": "dev" | "prod"
 *    }
 *
 *    Legacy format (still supported):
 *    {
 *      "tableName": "user",
 *      "direction": "dev-to-prod" | "prod-to-dev"
 *    }
 *
 *    Example POST requests:
 *    
 *    // Full database sync
 *    {
 *      "from": "prod",
 *      "to": "dev"
 *    }
 *
 *    // Single table sync
 *    {
 *      "tableName": "user",
 *      "from": "prod",
 *      "to": "dev"
 *    }
 *
 *    Response:
 *    {
 *      "success": true,
 *      "message": "Successfully synced 150 records",
 *      "from": "prod",
 *      "to": "dev",
 *      "tableName": "user", // if single table
 *      "recordCount": 150
 *    }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and authorization
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and check if they're admin
    const prodClient = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL! } }
    });
    
    const user = await prodClient.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      await prodClient.$disconnect();
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prodClient.$disconnect();

    const body = await request.json();
    let { tableName, from, to, direction } = body;

    // Handle legacy format
    if (direction && !from && !to) {
      from = direction === 'dev-to-prod' ? 'dev' : 'prod';
      to = direction === 'dev-to-prod' ? 'prod' : 'dev';
    }

    // Validate environments
    if (!from || !to || !['dev', 'prod'].includes(from) || !['dev', 'prod'].includes(to)) {
      return NextResponse.json(
        { error: "Valid 'from' and 'to' environments are required (dev|prod)" },
        { status: 400 }
      );
    }

    if (from === to) {
      return NextResponse.json(
        { error: "Source and target environments cannot be the same" },
        { status: 400 }
      );
    }

    const ENVIRONMENTS: Record<string, string> = {
      prod: process.env.DATABASE_URL!,
      dev: process.env.DEV_DATABASE_URL!,
    };

    if (!ENVIRONMENTS[from] || !ENVIRONMENTS[to]) {
      return NextResponse.json(
        { error: "Database URLs not configured for specified environments" },
        { status: 500 }
      );
    }

    const fromClient = new PrismaClient({
      datasources: { db: { url: ENVIRONMENTS[from] } }
    });
    
    const toClient = new PrismaClient({
      datasources: { db: { url: ENVIRONMENTS[to] } }
    });

    try {
      if (tableName) {
        // Single table sync
        return await syncSingleTable(fromClient, toClient, tableName, from, to);
      } else {
        // Full database sync
        return await syncFullDatabase(fromClient, toClient, from, to);
      }
    } finally {
      await fromClient.$disconnect();
      await toClient.$disconnect();
    }

  } catch (error) {
    console.error("Sync API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function syncSingleTable(fromClient: any, toClient: any, tableName: string, from: string, to: string) {
  try {
    // Check if table exists
    if (!fromClient[tableName] || !toClient[tableName]) {
      return NextResponse.json(
        { error: `Table '${tableName}' not found in schema` },
        { status: 400 }
      );
    }

    // Get source data
    const sourceData = await fromClient[tableName].findMany();
    
    if (sourceData.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No data to sync",
        from,
        to,
        tableName,
        recordCount: 0
      });
    }

    // Handle dependent tables for foreign key constraints
    const tableDependencies: Record<string, string[]> = {
      'user': ['userPlayer', 'linkRequest', 'linkRequestProof', 'userAuditLog', 'eventApplication'],
      'alliance': ['allianceStats', 'player', 'eventApplication'],
      'player': ['playerStats', 'userPlayer', 'playerCommander', 'playerEquipment'],
      'commander': ['user', 'playerCommander', 'applicationCommander', 'commanderPairing', 'commanderSkillTree'],
      'equipment': ['playerEquipment', 'applicationEquipment', 'equipmentAttribute', 'equipmentIconicAttribute', 'equipmentMaterial'],
      'attribute': ['equipmentAttribute', 'equipmentIconicAttribute'],
      'material': ['equipmentMaterial'],
      'event': ['eventApplication', 'eventRanking']
    };

    // Clear dependent tables first if they exist
    if (tableDependencies[tableName]) {
      for (const depTable of tableDependencies[tableName]) {
        try {
          if (toClient[depTable]) {
            await toClient[depTable].deleteMany({});
          }
        } catch (error) {
          console.warn(`Could not clear dependent table ${depTable}:`, error);
        }
      }
    }

    // Clear target table
    await toClient[tableName].deleteMany({});
    
    // Insert data in batches
    const batchSize = 100;
    let syncedCount = 0;
    
    for (let i = 0; i < sourceData.length; i += batchSize) {
      const batch = sourceData.slice(i, i + batchSize);
      try {
        await toClient[tableName].createMany({
          data: batch,
          skipDuplicates: true
        });
        syncedCount += batch.length;
      } catch (error) {
        console.warn(`Batch ${i}-${i + batch.length} failed:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} records`,
      from,
      to,
      tableName,
      recordCount: syncedCount,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: `Failed to sync table ${tableName}`, 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

async function syncFullDatabase(fromClient: any, toClient: any, from: string, to: string) {
  try {
    // Define tables in dependency order
    const tablesToSync = [
      // Dependent tables first (for clearing)
      'eventApplication', 'linkRequestProof', 'linkRequest', 'userPlayer', 'playerStats',
      'userAuditLog', 'allianceStats', 'playerCommander', 'playerEquipment',
      'applicationCommander', 'applicationEquipment', 'equipmentAttribute',
      'equipmentIconicAttribute', 'equipmentMaterial', 'commanderPairing',
      'commanderSkillTree', 'eventRanking',
      // Parent tables
      'player', 'alliance', 'equipment', 'commander', 'attribute', 'material', 'user', 'event'
    ];

    // Clear all tables first
    for (const tableName of tablesToSync) {
      try {
        if (toClient[tableName]) {
          await toClient[tableName].deleteMany({});
        }
      } catch (error) {
        console.warn(`Could not clear table ${tableName}:`, error);
      }
    }

    let totalSynced = 0;
    const results: any[] = [];

    // Sync data in reverse order (parents first)
    for (const tableName of tablesToSync.reverse()) {
      try {
        if (!fromClient[tableName] || !toClient[tableName]) {
          continue;
        }

        const sourceData = await fromClient[tableName].findMany();
        
        if (sourceData.length === 0) {
          results.push({ table: tableName, synced: 0, status: 'no_data' });
          continue;
        }

        const batchSize = 100;
        let synced = 0;
        
        for (let i = 0; i < sourceData.length; i += batchSize) {
          const batch = sourceData.slice(i, i + batchSize);
          await toClient[tableName].createMany({
            data: batch,
            skipDuplicates: true
          });
          synced += batch.length;
        }

        results.push({ table: tableName, synced, status: 'success' });
        totalSynced += synced;

      } catch (error) {
        results.push({ 
          table: tableName, 
          synced: 0, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalSynced} total records`,
      from,
      to,
      recordCount: totalSynced,
      results,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: "Full database sync failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
