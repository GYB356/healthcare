import { createPool } from './db-helper.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load all environment files
function loadEnvFiles() {
  // Load main .env file
  dotenv.config();
  
  // Try to load .env.secrets if it exists
  const secretsPath = path.join(__dirname, '..', '.env.secrets');
  if (fs.existsSync(secretsPath)) {
    dotenv.config({ path: secretsPath });
    console.log('.env.secrets file loaded');
  }
}

async function initializeDatabase() {
  // Load environment variables
  loadEnvFiles();
  
  console.log('Initializing database...');
  
  // Create database pool using our helper
  const pool = createPool();
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Enable detailed error messages
    console.log('Setting up error handling...');
    
    // Create tables...
    console.log('Creating tables if they don\'t exist...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Add more table creation statements as needed...
    
    console.log('Database initialization completed successfully');
    client.release();
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('Database setup complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during database setup:', error);
    process.exit(1);
  }); 