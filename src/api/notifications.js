import { db } from '../config/database';

// Get all notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT 
        n.id,
        n.message,
        n.type,
        n.read,
        n.created_at as "createdAt",
        n.updated_at as "updatedAt",
        n.metadata
      FROM notifications n
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const query = `
      UPDATE notifications
      SET read = true, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [notificationId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      UPDATE notifications
      SET read = true, updated_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING *
    `;
    
    const result = await db.query(query, [userId]);
    res.json({ message: `Marked ${result.rows.length} notifications as read` });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [notificationId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Create a new notification
export const createNotification = async (req, res) => {
  try {
    const { message, type, metadata } = req.body;
    const userId = req.user.id;
    
    const query = `
      INSERT INTO notifications (user_id, message, type, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await db.query(query, [userId, message, type, metadata]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND read = false
    `;
    
    const result = await db.query(query, [userId]);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}; 