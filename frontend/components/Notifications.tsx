import React, { useEffect, useState } from 'react';
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const socket = io("http://localhost:5000");

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    socket.emit("fetchNotifications", { userId: user.id });

    socket.on("notifications", (notifs) => setNotifications(notifs));
    socket.on("newNotification", (notif) => setNotifications((prev) => [...prev, notif]));

    return () => {
      socket.off("notifications");
      socket.off("newNotification");
    };
  }, [user]);

  const markAsRead = () => {
    socket.emit("markNotificationsRead", { userId: user.id });
    setNotifications([]);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="relative">
      <button className="relative">
        🛎️ Notifications
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {notifications.length > 0 && (
        <div className="absolute right-0 bg-white shadow-lg rounded-lg p-4 w-64">
          {notifications.map((notif, i) => (
            <p key={i} className="text-sm">{notif.message}</p>
          ))}
          <button className="text-blue-500 mt-2" onClick={markAsRead}>
            Mark as read
          </button>
        </div>
      )}
    </div>
  );
}