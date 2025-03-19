'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-xl">
          HealthcareSync
        </Link>
        <div className="hidden md:flex space-x-4">
          <Link
            href="/"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === '/' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/patients"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === '/patients' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Patients
          </Link>
          <Link
            href="/appointments"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === '/appointments' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Appointments
          </Link>
          <Link
            href="/messages"
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 ${
              pathname === '/messages' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <MessageSquare size={16} />
            Messages
          </Link>
        </div>
      </div>
    </nav>
  )
}