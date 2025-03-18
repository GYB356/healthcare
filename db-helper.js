import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env and .env.secrets
function loadEnvFiles() {
  // Load main .env file
  dotenv.config();
  
  // Try to load .env.secrets if it exists
  const secretsPath = path.join(__dirname, '.env.secrets');
  if (fs.existsSync(secretsPath)) {
    dotenv.config({ path: secretsPath });
    console.log('.env.secrets file loaded');
  }
}

// Create a safe connection string without exposing sensitive data
function getSafeConnectionInfo() {
  const {
    PGHOST, PGPORT, PGDATABASE, PGUSER,
    DATABASE_URL
  } = process.env;
  
  if (DATABASE_URL) {
    // Mask the password in the URL for logging
    try {
      const url = new URL(DATABASE_URL);
      url.password = '********';
      return { connectionString: DATABASE_URL, safeDisplayUrl: url.toString() };
    } catch (e) {
      return { connectionString: DATABASE_URL, safeDisplayUrl: 'Invalid URL format' };
    }
  } else if (PGHOST) {
    return {
      host: PGHOST,
      port: PGPORT,
      database: PGDATABASE,
      user: PGUSER,
      password: '********' // Mask for display
    };
  }
  
  return { error: 'No database connection information found in environment variables' };
}

// Test database connection function
export async function testDatabaseConnection() {
  loadEnvFiles();
  
  // Show connection info (safely)
  const connectionInfo = getSafeConnectionInfo();
  console.log('Database connection info:', connectionInfo);
  
  // Check if password is defined and is a string
  if (process.env.PGPASSWORD !== undefined) {
    console.log('PGPASSWORD is defined:', 
      typeof process.env.PGPASSWORD === 'string' ? 'as a string' : `as ${typeof process.env.PGPASSWORD}`);
  } else {
    console.log('PGPASSWORD is not defined');
  }
  
  // Create proper connection configuration
  const pgConfig = {};
  
  if (process.env.DATABASE_URL) {
    pgConfig.connectionString = process.env.DATABASE_URL;
    // Ensure SSL is configured correctly if needed
    if (process.env.DATABASE_URL.includes('ssl=true')) {
      pgConfig.ssl = { rejectUnauthorized: false };
    }
  } else {
    // Use individual connection parameters
    pgConfig.host = process.env.PGHOST;
    pgConfig.port = process.env.PGPORT;
    pgConfig.database = process.env.PGDATABASE;
    pgConfig.user = process.env.PGUSER;
    pgConfig.password = process.env.PGPASSWORD;
    
    // Add SSL if specified
    if (process.env.PGSSLMODE === 'require') {
      pgConfig.ssl = { rejectUnauthorized: false };
    }
  }
  
  // Create a client with the config
  const client = new pg.Client(pgConfig);
  
  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    const result = await client.query('SELECT current_timestamp');
    console.log('Database time:', result.rows[0].current_timestamp);
    return true;
  } catch (error) {
    console.error('Failed to connect to the database:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('password')) {
      console.log('\nPossible password-related issues:');
      console.log('1. Make sure PGPASSWORD is set correctly in your .env.secrets file');
      console.log('2. Ensure the password doesn\'t contain special characters that need escaping');
      console.log('3. Check if the password is enclosed in quotes in your .env file (it shouldn\'t be)');
    }
    
    return false;
  } finally {
    await client.end();
  }
}

// Create production-ready pool
export function createPool() {
  loadEnvFiles();
  
  // Create proper connection configuration
  const pgConfig = {};
  
  if (process.env.DATABASE_URL) {
    pgConfig.connectionString = process.env.DATABASE_URL;
    // Ensure SSL is configured correctly if needed
    if (process.env.DATABASE_URL.includes('ssl=true') || 
        process.env.NODE_ENV === 'production') {
      pgConfig.ssl = { rejectUnauthorized: false };
    }
  } else {
    // Use individual connection parameters
    pgConfig.host = process.env.PGHOST;
    pgConfig.port = process.env.PGPORT;
    pgConfig.database = process.env.PGDATABASE;
    pgConfig.user = process.env.PGUSER;
    pgConfig.password = process.env.PGPASSWORD;
    
    // Add SSL if specified
    if (process.env.PGSSLMODE === 'require') {
      pgConfig.ssl = { rejectUnauthorized: false };
    }
  }
  
  // Add pool configuration
  pgConfig.max = parseInt(process.env.PG_MAX_CONNECTIONS || '10');
  pgConfig.idleTimeoutMillis = 30000;
  
  return new pg.Pool(pgConfig);
}

// If this file is run directly, test the connection
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
} 