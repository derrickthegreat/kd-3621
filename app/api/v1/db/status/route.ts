import { NextRequest, NextResponse } from "next/server";
import { getDBClient } from "@/lib/db/clients";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const prodClient = getDBClient('production');
    const user = await prodClient.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const environment = searchParams.get('env') as 'production' | 'development' || 'production';

    const client = getDBClient(environment);
    
    // Get table names from Prisma schema
    const tables = [
      'User',
      'UserAuditLog',
      'Commander', 
      'Equipment',
      'UserPlayer',
      'LinkRequest',
      'LinkRequestProof',
      // Add other table names from your schema
    ];

    const tableStats = await Promise.all(
      tables.map(async (tableName) => {
        try {
          const count = await (client as any)[tableName.toLowerCase()].count();
          return { tableName, count, error: null };
        } catch (error) {
          return { 
            tableName, 
            count: 0, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    return NextResponse.json({
      environment,
      tables: tableStats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Database status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
