import express from 'express';
import { io } from '../server';

const router = express.Router();

// Endpoint to send a test notification
router.post('/test-notification', (req, res) => {
  try {
    const { userId, type } = req.body;
    
    if (!userId || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create a test notification based on the type
    const notification = {
      type,
      message: `Test ${type} notification from server`,
      data: {
        id: `test-${Date.now()}`,
        title: `Test ${type} Title`,
        status: 'pending',
        date: new Date().toISOString(),
      }
    };
    
    // Emit the notification to the specific user
    io.to(userId).emit('notification', notification);
    
    // Log the notification for debugging
    console.log(`Test notification sent to user ${userId}:`, notification);
    
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Endpoint to handle direct socket test notifications
router.post('/socket-test', (req, res) => {
  try {
    const { userId, notification } = req.body;
    
    if (!userId || !notification) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Emit the notification to the specific user
    io.to(userId).emit('notification', notification);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling socket test:', error);
    return res.status(500).json({ error: 'Failed to handle socket test' });
  }
});

export default router; 