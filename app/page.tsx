import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to HealthcareSync
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A comprehensive healthcare management system for patients and providers
          </p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">For Patients</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Access medical records securely</li>
              <li>• Schedule appointments online</li>
              <li>• Communicate with healthcare providers</li>
              <li>• View and manage prescriptions</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">For Doctors</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Manage patient records efficiently</li>
              <li>• Track appointments and schedules</li>
              <li>• Issue prescriptions digitally</li>
              <li>• Access medical history instantly</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">For Staff</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Streamline administrative tasks</li>
              <li>• Manage patient appointments</li>
              <li>• Handle billing and insurance</li>
              <li>• Generate reports and analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}