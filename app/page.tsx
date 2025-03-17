import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-center text-gray-900">
            Roofing Tracker
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Manage your roofing projects efficiently
          </p>
        </div>
        <div className="mt-8 space-y-4">
          <Link href="/auth/login" 
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Login
          </Link>
          <Link href="/auth/register"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Register
          </Link>
        </div>
      </div>
    </main>
  )
}