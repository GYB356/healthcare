import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Mock user data (replace with actual user model in production)
const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'customer' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'contractor' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'customer' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'contractor' }
];

// Get all users
router.get('/', (req, res) => {
  try {
    // In a real application, you would fetch users from the database
    // and apply proper filtering, pagination, etc.
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find user by ID
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router; 