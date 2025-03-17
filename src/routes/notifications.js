import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount
} from '../api/notifications';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all notifications for the current user
router.get('/', getNotifications);

// Get unread notifications count
router.get('/unread-count', getUnreadCount);

// Mark a notification as read
router.put('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', markAllNotificationsAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

// Create a new notification (admin only)
router.post('/', createNotification);

export default router; 