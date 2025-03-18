import express from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId; // Assuming middleware sets this
    
    const result = await client.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  } finally {
    client.release();
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    const { name, email } = req.body;
    
    const result = await client.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, email, name',
      [name, email, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  } finally {
    client.release();
  }
});

export default router; 