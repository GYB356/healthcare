import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Roofing Project Dashboard</h1>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/projects" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Projects</h2>
          <p className="text-gray-600">Manage your roofing projects</p>
        </Link>
        
        <Link href="/clients" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Clients</h2>
          <p className="text-gray-600">View and manage client information</p>
        </Link>
        
        <Link href="/estimates" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Estimates</h2>
          <p className="text-gray-600">Create and track project estimates</p>
        </Link>
      </div>
    </div>
  )
}