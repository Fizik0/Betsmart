import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import { log } from './vite';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// For query purposes
export const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

// Log successful connection
log('Connected to PostgreSQL database', 'db');