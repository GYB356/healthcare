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

// Get all tasks
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  } finally {
    client.release();
  }
});

// Create new task
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, description, projectId, assignedTo, dueDate, priority } = req.body;
    
    const result = await client.query(
      `INSERT INTO tasks (
        id, title, description, project_id, assigned_to, 
        due_date, priority, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [uuidv4(), title, description, projectId, assignedTo, dueDate, priority]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  } finally {
    client.release();
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM tasks WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  } finally {
    client.release();
  }
});

// Update task
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, description, projectId, assignedTo, dueDate, priority, status } = req.body;
    
    const result = await client.query(
      `UPDATE tasks 
       SET title = $1, description = $2, project_id = $3, 
           assigned_to = $4, due_date = $5, priority = $6, status = $7
       WHERE id = $8
       RETURNING *`,
      [title, description, projectId, assignedTo, dueDate, priority, status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  } finally {
    client.release();
  }
});

export default router; 