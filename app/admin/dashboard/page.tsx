'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useState, useEffect } from 'react';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalEstimates: number;
  totalClients: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalEstimates: 0,
    totalClients: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  if (!session?.user || session.user.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Dashboard</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-indigo-600">Total Projects</h3>
              <p className="mt-2 text-3xl font-semibold text-indigo-900">{stats.totalProjects}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-600">Active Projects</h3>
              <p className="mt-2 text-3xl font-semibold text-green-900">{stats.activeProjects}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-600">Total Estimates</h3>
              <p className="mt-2 text-3xl font-semibold text-blue-900">{stats.totalEstimates}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-600">Total Clients</h3>
              <p className="mt-2 text-3xl font-semibold text-purple-900">{stats.totalClients}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-pink-600">Total Users</h3>
              <p className="mt-2 text-3xl font-semibold text-pink-900">{stats.totalUsers}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">User Management</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/admin/users')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  View All Users
                </button>
                <button
                  onClick={() => router.push('/admin/users/new')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Add New User
                </button>
                <button
                  onClick={() => router.push('/admin/roles')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Manage Roles
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Project Management</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/projects')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  View All Projects
                </button>
                <button
                  onClick={() => router.push('/projects/new')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Create New Project
                </button>
                <button
                  onClick={() => router.push('/admin/project-settings')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Project Settings
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">System Settings</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/admin/settings')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  General Settings
                </button>
                <button
                  onClick={() => router.push('/admin/backup')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Backup & Restore
                </button>
                <button
                  onClick={() => router.push('/admin/logs')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  System Logs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 