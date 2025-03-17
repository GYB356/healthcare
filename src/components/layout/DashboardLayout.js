// src/components/layout/DashboardLayout.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home,
  Calendar,
  Clipboard,
  Users,
  Package,
  BarChart2,
  Settings,
  HelpCircle,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  User,
  ChevronDown
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        setNotifications(data);
        setUnreadNotifications(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const isCurrentPath = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const results = await response.json();
        // Handle search results
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  };

  // Enhanced navigation items with role-based access
  const navigationItems = [
    { 
      name: 'Dashboard', 
      icon: <Home size={20} />, 
      path: '/dashboard',
      roles: ['admin', 'doctor', 'patient']
    },
    { 
      name: 'Projects', 
      icon: <Clipboard size={20} />, 
      path: '/projects',
      roles: ['admin', 'doctor']
    },
    { 
      name: 'Clients', 
      icon: <Users size={20} />, 
      path: '/clients',
      roles: ['admin', 'doctor']
    },
    { 
      name: 'Calendar', 
      icon: <Calendar size={20} />, 
      path: '/calendar',
      roles: ['admin', 'doctor', 'patient']
    },
    { 
      name: 'Materials', 
      icon: <Package size={20} />, 
      path: '/inventory',
      roles: ['admin']
    },
    { 
      name: 'Reports', 
      icon: <BarChart2 size={20} />, 
      path: '/reports',
      roles: ['admin', 'doctor']
    },
    { 
      name: 'Settings', 
      icon: <Settings size={20} />, 
      path: '/settings',
      roles: ['admin', 'doctor', 'patient']
    },
    { 
      name: 'Help', 
      icon: <HelpCircle size={20} />, 
      path: '/help',
      roles: ['admin', 'doctor', 'patient']
    },
  ];

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => 
    item.roles.includes(currentUser?.role?.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              HealthcareSync
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredNavigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isCurrentPath(item.path)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {currentUser?.name?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {currentUser?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : ''} flex flex-col min-h-screen`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 lg:hidden"
            >
              <Menu size={20} />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-4 py-2 pl-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </form>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center p-2 rounded-full hover:bg-gray-100"
              >
                <Bell size={20} className="text-gray-400" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2">
                  <div className="px-4 py-2 border-b">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t">
                    <Link
                      href="/notifications"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
              >
                <User size={20} className="text-gray-400" />
                <ChevronDown size={16} className="text-gray-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;