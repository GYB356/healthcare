import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  timestamp: Date;
  prescriptionId?: string;
}

interface NotificationData {
  type: string;
  message: string;
  prescriptionId?: string;
  timestamp?: Date;
}

export default function NotificationSystem() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.id) return;

    // Connect to the Socket.IO server
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    setSocket(socketInstance);

    // Join the user's room for personalized notifications
    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      socketInstance.emit('joinRoom', user.id);
    });

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    // Listen for legacy notifications
    socket.on('notification', (data: string) => {
      try {
        const notificationData: NotificationData = JSON.parse(data);
        
        // Create a new notification
        const newNotification: Notification = {
          id: Math.random().toString(36).substring(2, 9),
          message: notificationData.message,
          type: notificationData.type,
          read: false,
          timestamp: new Date(),
          prescriptionId: notificationData.prescriptionId
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show notification popup
        showNotificationPopup(newNotification);
      } catch (err) {
        console.error('Error parsing notification:', err);
      }
    });

    // Listen for new direct notifications
    socket.on('newNotification', (data: NotificationData) => {
      const newNotification: Notification = {
        id: Math.random().toString(36).substring(2, 9),
        message: data.message,
        type: data.type,
        read: false,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        prescriptionId: data.prescriptionId
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      // Show notification popup
      showNotificationPopup(newNotification);
    });

    return () => {
      socket.off('notification');
      socket.off('newNotification');
    };
  }, [socket]);

  const showNotificationPopup = (notification: Notification) => {
    // You could use a toast library here, but for simplicity we'll just use browser notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Medical App Notification', {
        body: notification.message
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Medical App Notification', {
            body: notification.message
          });
        }
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2 px-3 bg-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium">Notifications</h3>
            {notifications.length > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-4 px-3 text-sm text-gray-500 text-center">
                No notifications
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`py-2 px-3 border-b hover:bg-gray-50 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 