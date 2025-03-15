import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <a className="text-xl font-bold">Roofing Tracker</a>
          </Link>
          
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <a className="hover:underline">Dashboard</a>
                </Link>
                <Link href="/appointments">
                  <a className="hover:underline">Appointments</a>
                </Link>
                <Link href="/messages">
                  <a className="hover:underline">Messages</a>
                </Link>
                {user.role === 'customer' && (
                  <Link href="/my-prescriptions">
                    <a className="hover:underline">My Prescriptions</a>
                  </Link>
                )}
                {user.role === 'contractor' && (
                  <Link href="/projects">
                    <a className="hover:underline">Projects</a>
                  </Link>
                )}
                {user && (
                  <>
                    <Notifications />
                    {process.env.NODE_ENV === 'development' && (
                      <>
                        <Link href="/test-notifications">
                          <a className="text-yellow-500 hover:underline">Test Notifications</a>
                        </Link>
                        <Link href="/chat-test">
                          <a className="text-yellow-500 hover:underline">Test Chat</a>
                        </Link>
                      </>
                    )}
                  </>
                )}
                <button 
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <a className="hover:underline">Login</a>
                </Link>
                <Link href="/register">
                  <a className="bg-white text-blue-600 px-3 py-1 rounded text-sm">
                    Register
                  </a>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      <footer className="bg-gray-100 border-t">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600">
            &copy; {new Date().getFullYear()} Roofing Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 