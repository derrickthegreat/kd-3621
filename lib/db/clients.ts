import { PrismaClient } from "@prisma/client";

// Type for database configuration
interface DatabaseConfig {
  url: string;
  directUrl?: string;
}

// Global variables for client instances to prevent multiple connections
declare global {
  var __prodPrisma: PrismaClient | undefined;
  var __devPrisma: PrismaClient | undefined;
}

// Production database client
export const prodPrisma = global.__prodPrisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL!,
    },
  },
});

// Development database client (if dev URL is provided)
export const devPrisma = global.__devPrisma || (process.env.DEV_DATABASE_URL ? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DEV_DATABASE_URL!,
    },
  },
}) : null);

// Default client (production)
export const prisma = prodPrisma;

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  global.__prodPrisma = prodPrisma;
  if (devPrisma) {
    global.__devPrisma = devPrisma;
  }
}

// Utility function to get the appropriate client
export function getDBClient(environment: 'production' | 'development' = 'production') {
  switch (environment) {
    case 'development':
      if (!devPrisma) {
        throw new Error('Development database URL not configured');
      }
      return devPrisma;
    case 'production':
    default:
      return prodPrisma;
  }
}

// Utility function to run operations on both databases
export async function runOnBothDatabases<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<{ production: T; development?: T }> {
  const results: { production: T; development?: T } = {
    production: await operation(prodPrisma),
  };

  if (devPrisma) {
    try {
      results.development = await operation(devPrisma);
    } catch (error) {
      console.error('Development database operation failed:', error);
    }
  }

  return results;
}

// Graceful shutdown
export async function disconnectAll() {
  await prodPrisma.$disconnect();
  if (devPrisma) {
    await devPrisma.$disconnect();
  }
}
