'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface Appointment {
  id: string;
  date: string;
  time: string;
  type: string;
  status: string;
  doctor: {
    name: string;
  };
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  treatment: string;
  notes: string;
  createdAt: string;
}

interface BillingRecord {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
}

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appointmentsRes, medicalRecordsRes, billingRecordsRes] = await Promise.all([
          fetch('/api/patient/appointments'),
          fetch('/api/patient/medical-records'),
          fetch('/api/patient/billing'),
        ]);

        if (appointmentsRes.ok) {
          const data = await appointmentsRes.json();
          setAppointments(data.appointments);
        }

        if (medicalRecordsRes.ok) {
          const data = await medicalRecordsRes.json();
          setMedicalRecords(data.records);
        }

        if (billingRecordsRes.ok) {
          const data = await billingRecordsRes.json();
          setBillingRecords(data.records);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['patient']}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Patient Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Appointments</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {appointments.filter(a => a.status === 'scheduled').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Medical Records</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {medicalRecords.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCardIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {billingRecords.filter(b => b.status === 'pending').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Primary Doctor</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {appointments[0]?.doctor.name || 'Not assigned'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Upcoming Appointments</h3>
              <div className="mt-5">
                {appointments.filter(a => a.status === 'scheduled').length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {appointments
                      .filter(a => a.status === 'scheduled')
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 5)
                      .map(appointment => (
                        <li key={appointment.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {appointment.type}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No upcoming appointments</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Medical Records</h3>
              <div className="mt-5">
                {medicalRecords.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {medicalRecords
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map(record => (
                        <li key={record.id} className="py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {record.diagnosis}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(record.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No medical records found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 