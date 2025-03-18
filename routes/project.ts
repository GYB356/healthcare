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

// Get all projects
router.get('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM projects ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  } finally {
    client.release();
  }
});

// Create new project
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, description, startDate, endDate } = req.body;
    
    const result = await client.query(
      `INSERT INTO projects (id, name, description, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [uuidv4(), name, description, startDate, endDate]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  } finally {
    client.release();
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM projects WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  } finally {
    client.release();
  }
});

// Update project
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, description, startDate, endDate } = req.body;
    
    const result = await client.query(
      `UPDATE projects 
       SET name = $1, description = $2, start_date = $3, end_date = $4
       WHERE id = $5
       RETURNING *`,
      [name, description, startDate, endDate, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  } finally {
    client.release();
  }
});

export default router; 