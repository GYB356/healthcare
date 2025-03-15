import React from 'react';
import { useAuth } from '../context/AuthContext';
import socket from '../utils/socket';

export default function TestNotifications() {
  const { user } = useAuth();
  
  const sendTestNotification = (type: string) => {
    if (!user) return;
    
    // Send a test notification to the server
    fetch('/api/test-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        type,
      }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Test notification sent:', data);
      })
      .catch(error => {
        console.error('Error sending test notification:', error);
      });
  };

  // Function to emit a direct socket event (bypassing the server API)
  const emitDirectNotification = (type: string) => {
    if (!socket.connected) {
      alert('Socket not connected. Please try again in a moment.');
      return;
    }

    const notificationData = {
      type,
      message: `Test ${type} notification`,
      data: {
        id: 'test-id-' + Date.now(),
        title: `Test ${type} Title`,
        status: 'pending',
        date: new Date().toISOString(),
      }
    };

    // Emit the notification directly to the current user
    socket.emit('test-notification', {
      userId: user?.id,
      notification: notificationData
    });

    console.log('Direct notification emitted:', notificationData);
  };

  if (!user) {
    return <div className="p-4">Please log in to test notifications</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Notifications</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">API Notifications</h2>
        <p className="mb-2">These will call the backend API to trigger notifications:</p>
        <div className="flex space-x-2">
          <button
            onClick={() => sendTestNotification('appointment')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Test Appointment Notification
          </button>
          <button
            onClick={() => sendTestNotification('prescription')}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Test Prescription Notification
          </button>
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Direct Socket Notifications</h2>
        <p className="mb-2">These will emit socket events directly from the client:</p>
        <div className="flex space-x-2">
          <button
            onClick={() => emitDirectNotification('appointment')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            Direct Appointment Notification
          </button>
          <button
            onClick={() => emitDirectNotification('prescription')}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded"
          >
            Direct Prescription Notification
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">Debug Info:</h3>
        <p>User ID: {user.id}</p>
        <p>Socket Connected: {socket.connected ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
} 