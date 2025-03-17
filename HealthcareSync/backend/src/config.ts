import { Pool } from 'pg';
import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Verify required environment variables
const requiredEnvVars = ['DATABASE_URL', 'PORT', 'FRONTEND_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`);
  }
}

// Database configuration
console.log('Creating database pool...');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure connection events
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', {
    error: err.message,
    stack: err.stack
  });
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('Successfully established new database connection');
});

// Initialize Drizzle ORM
console.log('Initializing Drizzle ORM...');
export const db = drizzle(pool);

// Server configuration
export const PORT = Number(process.env.PORT || 5000);
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const CORS_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

// Log configuration
console.log('Configuration loaded:', {
  port: PORT,
  node_env: NODE_ENV,
  cors_origin: CORS_ORIGIN,
  database_connected: true
});

export default {
  db,
  PORT,
  NODE_ENV,
  CORS_ORIGIN
};