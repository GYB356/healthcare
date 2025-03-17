'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

interface Patient {
  id: string;
  name: string;
  lastVisit: string | null;
  upcomingAppointment: string | null;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingReports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch appointments
        const appointmentsRes = await fetch('/api/doctor/appointments', {
          credentials: 'include',
        });
        if (appointmentsRes.ok) {
          const data = await appointmentsRes.json();
          setAppointments(data.appointments);
        }

        // Fetch recent patients
        const patientsRes = await fetch('/api/doctor/patients', {
          credentials: 'include',
        });
        if (patientsRes.ok) {
          const data = await patientsRes.json();
          setRecentPatients(data.patients);
        }

        // Fetch stats
        const statsRes = await fetch('/api/doctor/stats', {
          credentials: 'include',
        });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleStartConsultation = (appointmentId: string) => {
    router.push(`/consultation/${appointmentId}`);
  };

  const handleViewPatientHistory = (patientId: string) => {
    router.push(`/patient/${patientId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Doctor Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Today's Appointments</h2>
          <p className="text-4xl font-bold text-blue-600">{stats.todayAppointments}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Total Patients</h2>
          <p className="text-4xl font-bold text-green-600">{stats.totalPatients}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Pending Reports</h2>
          <p className="text-4xl font-bold text-yellow-600">{stats.pendingReports}</p>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Today's Appointments</h2>
          {appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patientName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${appointment.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' : 
                            appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                            'bg-blue-100 text-blue-800'}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleStartConsultation(appointment.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          disabled={appointment.status !== 'SCHEDULED'}
                        >
                          Start Consultation
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No appointments scheduled for today</p>
          )}
        </div>
      </div>

      {/* Recent Patients */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Patients</h2>
          {recentPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Appointment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.lastVisit || 'No previous visits'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {patient.upcomingAppointment || 'No upcoming appointments'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewPatientHistory(patient.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent patients</p>
          )}
        </div>
      </div>
    </div>
  );
} 