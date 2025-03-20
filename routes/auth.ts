import express from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, name } = req.body;
    
    // Check if user exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await client.query(
      'INSERT INTO users (id, email, password, name) VALUES ($1, $2, $3, $4) RETURNING id, email, name',
      [uuidv4(), email, hashedPassword, name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  } finally {
    client.release();
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;
    
    // Get user
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  } finally {
    client.release();
  }
});

export default router; 