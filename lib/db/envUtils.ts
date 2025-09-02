import { getDBClient } from './clients';

/**
 * Get database client based on current environment
 * Defaults to production in production, development otherwise
 */
export function getEnvBasedClient() {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return getDBClient(env);
}

/**
 * Get database client with explicit override
 * Useful for testing or admin operations
 */
export function getClientWithOverride(forceEnv?: 'production' | 'development') {
  if (forceEnv) {
    return getDBClient(forceEnv);
  }
  return getEnvBasedClient();
}

/**
 * Execute a database operation with environment selection
 */
export async function executeWithEnv<T>(
  operation: (client: any) => Promise<T>,
  environment?: 'production' | 'development'
): Promise<T> {
  const client = getClientWithOverride(environment);
  return await operation(client);
}
