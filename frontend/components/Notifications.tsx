import React, { useEffect, useState } from "react";
import { socket, connectSocket } from "../utils/socket";
import { useAuth } from "../context/AuthContext";

interface Notification {
  type: string;
  message: string;
  timestamp: Date;
  read?: boolean;
  appointmentId?: string;
  prescriptionId?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !user.id) return;

    // Connect to socket and join user's room
    connectSocket(user.id);

    // Listen for new notifications
    socket.on("newNotification", (notification: Notification) => {
      // Add read status and ensure timestamp is a Date object
      const newNotification = {
        ...notification,
        read: false,
        timestamp: notification.timestamp ? new Date(notification.timestamp) : new Date()
      };
      
      setNotifications((prev) => [newNotification, ...prev]);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Notification', {
          body: notification.message
        });
      }
    });

    return () => {
      socket.off("newNotification");
    };
  }, [user]);

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  const markAsRead = (index: number) => {
    setNotifications(prev => 
      prev.map((notif, i) => 
        i === index ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button 
        onClick={toggleNotifications}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
        aria-label="Notifications"
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
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-4 bg-white shadow-lg rounded-lg w-80 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <div className="flex space-x-2">
              {notifications.length > 0 && (
                <>
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                  <button 
                    onClick={clearNotifications}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No new notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif, index) => (
                  <div 
                    key={index} 
                    className={`p-3 border rounded-md ${notif.read ? 'bg-white' : 'bg-blue-50'}`}
                    onClick={() => markAsRead(index)}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm">{notif.message}</p>
                      {!notif.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.timestamp).toLocaleString()}
                    </p>
                    
                    {/* Action buttons based on notification type */}
                    {notif.type === "appointment" && notif.appointmentId && (
                      <a 
                        href={`/appointments/${notif.appointmentId}`}
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View Appointment
                      </a>
                    )}
                    
                    {notif.type === "prescription" && notif.prescriptionId && (
                      <a 
                        href={`/my-prescriptions?id=${notif.prescriptionId}`}
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View Prescription
                      </a>
                    )}
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