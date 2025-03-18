const fs = require('fs');
const { Pool } = require('pg');

// This script uses Common JS format to be more compatible
console.log('Starting database connection test...');

// Load environment variables manually
function loadEnvVars() {
  try {
    // Load .env
    let envContent = '';
    try {
      envContent = fs.readFileSync('.env', 'utf8');
    } catch (err) {
      console.log('No .env file found');
    }

    // Load .env.secrets
    let secretsContent = '';
    try {
      secretsContent = fs.readFileSync('.env.secrets', 'utf8');
      console.log('.env.secrets file found');
    } catch (err) {
      console.log('No .env.secrets file found');
    }

    // Parse and merge both files
    const variables = {};
    
    [envContent, secretsContent].forEach(content => {
      if (!content) return;
      
      content.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) return;
        
        // Parse KEY=VALUE
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          variables[key.trim()] = value.trim();
        }
      });
    });
    
    // Set environment variables
    Object.entries(variables).forEach(([key, value]) => {
      process.env[key] = value;
    });
    
    // Print loaded environment variables (safely)
    console.log('\nLoaded environment variables:');
    Object.keys(variables).forEach(key => {
      if (key.includes('PASSWORD') || key.includes('SECRET')) {
        console.log(`${key}=********`);
      } else {
        console.log(`${key}=${variables[key]}`);
      }
    });
  } catch (err) {
    console.error('Error loading environment variables:', err);
  }
}

// Test database connection
async function testConnection() {
  loadEnvVars();
  
  console.log('\nTesting database connection...');
  
  // Connection config
  const config = {};
  
  // Use connection string if available
  if (process.env.DATABASE_URL) {
    console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@')}`);
    config.connectionString = process.env.DATABASE_URL;
    
    // Add SSL settings if needed
    if (process.env.DATABASE_URL.includes('ssl=true')) {
      config.ssl = { rejectUnauthorized: false };
    }
  } else {
    // Use individual connection parameters
    console.log('Using individual connection parameters:');
    config.host = process.env.PGHOST;
    config.port = process.env.PGPORT;
    config.database = process.env.PGDATABASE;
    config.user = process.env.PGUSER;
    config.password = process.env.PGPASSWORD;
    
    console.log(`Host: ${config.host}`);
    console.log(`Port: ${config.port}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}`);
    console.log(`Password: ${config.password ? '********' : 'not set'}`);
  }
  
  // Check if we have enough info to connect
  if (!config.connectionString && 
      (!config.host || !config.database || !config.user || !config.password)) {
    console.error('\nERROR: Insufficient database configuration');
    console.error('Please provide either DATABASE_URL or all individual parameters');
    return;
  }
  
  // Try to connect
  const pool = new Pool(config);
  
  try {
    console.log('\nAttempting to connect to database...');
    const client = await pool.connect();
    console.log('SUCCESS: Connected to the database!');
    
    // Try a simple query
    const result = await client.query('SELECT NOW() as time');
    console.log(`Database time: ${result.rows[0].time}`);
    
    client.release();
  } catch (err) {
    console.error('\nERROR: Failed to connect to database');
    console.error(`Error message: ${err.message}`);
    console.error(`Error code: ${err.code}`);
    
    // Add helpful hints based on error
    if (err.code === 'ECONNREFUSED') {
      console.log('\nPossible solutions:');
      console.log('1. Make sure PostgreSQL service is running');
      console.log('2. Check that the host and port are correct');
      console.log('3. Check if firewall is blocking the connection');
    } else if (err.code === '28P01') {
      console.log('\nPossible solutions:');
      console.log('1. Check that username and password are correct');
      console.log('2. Ensure password doesn\'t have quotes in the .env file');
    } else if (err.code === '3D000') {
      console.log('\nPossible solutions:');
      console.log('1. Database does not exist - create it first');
      console.log('2. Check if database name is spelled correctly');
    }
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // Ignore close errors
    }
  }
}

// Run the test
testConnection()
  .catch(err => {
    console.error('Unexpected error:', err);
  }); 