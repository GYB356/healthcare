'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-xl">
          Roofing Tracker
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
            href="/projects"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === '/projects' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Projects
          </Link>
          <Link
            href="/clients"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === '/clients' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Clients
          </Link>
          <Link
            href="/estimates"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === '/estimates' ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Estimates
          </Link>
        </div>
      </div>
    </nav>
  )
}