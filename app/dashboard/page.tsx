'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/layouts/DashboardLayout';

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.role) {
      switch (session.user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'manager':
          router.push('/manager/dashboard');
          break;
        case 'estimator':
          router.push('/estimator/dashboard');
          break;
        default:
          // Regular user stays on this page
          break;
      }
    }
  }, [session, router]);

  if (!session?.user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Welcome, {session.user.name || session.user.email}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Projects Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Your Projects</h2>
            <p className="text-gray-500">View and manage your assigned projects</p>
            <button
              onClick={() => router.push('/projects')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              View Projects
            </button>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Recent Activity</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/projects/new')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Create New Project
              </button>
              <button
                onClick={() => router.push('/projects?filter=active')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                View Active Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 