import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load both .env and .env.secrets
dotenv.config();
dotenv.config({ path: '.env.secrets' });

// Check if .env.secrets file exists
if (!fs.existsSync('.env.secrets')) {
  console.error('.env.secrets file not found');
} else {
  console.log('.env.secrets file loaded');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database initialization...');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, '..', 'create_tables.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
        console.log('Executed SQL statement successfully');
      }
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the initialization
initializeDatabase().catch(console.error);