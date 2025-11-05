import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';
import ws from 'ws';

// Configure WebSocket for local development
neonConfig.webSocketConstructor = ws;

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool
const pool = new Pool({ connectionString: databaseUrl });

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Export schema for use in queries
export * from './schema';
