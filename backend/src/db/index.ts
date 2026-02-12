import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import { env } from '../config/env.js';

// Create PostgreSQL connection
const queryClient = postgres(env.DATABASE_URL);

// Create Drizzle ORM instance
export const db = drizzle(queryClient, { schema });

// Export schema for use in other modules
export * from './schema.js';

// Export query client for closing connection
export { queryClient };
