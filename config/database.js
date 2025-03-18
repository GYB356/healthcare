import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load both .env and .env.secrets
dotenv.config();
dotenv.config({ path: '.env.secrets' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

export default pool; 