"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams?.get('registered');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('Attempting login with:', formData.email);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include', // Important for cookies
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (res.ok) {
        console.log('Login successful, user role:', data.user.role);
        
        // Force a small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirect based on user role
        const redirectPath = (() => {
          switch (data.user.role) {
            case 'ADMIN':
              return '/dashboard/admin';
            case 'DOCTOR':
              return '/dashboard/doctor';
            case 'PATIENT':
              return '/dashboard/patient';
            default:
              return '/dashboard';
          }
        })();

        console.log('Redirecting to:', redirectPath);
        router.push(redirectPath);
        router.refresh(); // Force a refresh to update the navigation state
      } else {
        console.log('Login failed:', data.error);
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-center text-gray-900">Login</h1>
          <p className="mt-2 text-center text-gray-600">
            Sign in to your account
          </p>
        </div>

        {justRegistered && (
          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
            Registration successful! Please log in with your credentials.
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>
        </form>

        <div className="text-center">
          <Link href="/auth/register" className="text-blue-600 hover:text-blue-500">
            Don't have an account? Register
          </Link>
        </div>
      </div>
    </main>
  );
} 