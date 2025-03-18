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

// Get user's notifications
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    
    const result = await client.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  } finally {
    client.release();
  }
});

// Create notification
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId, message, type } = req.body;
    
    const result = await client.query(
      `INSERT INTO notifications (id, user_id, message, type, read)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [uuidv4(), userId, message, type]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  } finally {
    client.release();
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE notifications 
       SET read = true 
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  } finally {
    client.release();
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM notifications WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  } finally {
    client.release();
  }
});

export default router; 