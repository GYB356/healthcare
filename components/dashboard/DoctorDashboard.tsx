'use client';

import { useEffect, useState } from 'react';
import { Appointment, MedicalRecord, DeviceData } from '@/types';
import {
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appointmentsRes, medicalRecordsRes, deviceDataRes] = await Promise.all([
          fetch('/api/doctor/appointments'),
          fetch('/api/doctor/medical-records'),
          fetch('/api/doctor/device-data'),
        ]);

        if (appointmentsRes.ok) {
          const data = await appointmentsRes.json();
          setAppointments(data.appointments);
        }

        if (medicalRecordsRes.ok) {
          const data = await medicalRecordsRes.json();
          setMedicalRecords(data.records);
        }

        if (deviceDataRes.ok) {
          const data = await deviceDataRes.json();
          setDeviceData(data.deviceData);
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Doctor Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Today's Appointments</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {appointments.filter(a => 
                      a.status === 'scheduled' && 
                      new Date(a.date).toDateString() === new Date().toDateString()
                    ).length}
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
                <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Patients</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Set(medicalRecords.map(r => r.patientId)).size}
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
                <DocumentTextIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Recent Records</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {medicalRecords.filter(r => 
                      new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length}
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
                <DevicePhoneMobileIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Device Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {deviceData.filter(d => 
                      new Date(d.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                    ).length}
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
            <h3 className="text-lg font-medium leading-6 text-gray-900">Today's Schedule</h3>
            <div className="mt-5">
              {appointments.filter(a => 
                a.status === 'scheduled' && 
                new Date(a.date).toDateString() === new Date().toDateString()
              ).length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {appointments
                    .filter(a => 
                      a.status === 'scheduled' && 
                      new Date(a.date).toDateString() === new Date().toDateString()
                    )
                    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                    .slice(0, 5)
                    .map(appointment => (
                      <li key={appointment.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {appointment.type}
                            </p>
                            <p className="text-sm text-gray-500">
                              {appointment.time}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No appointments scheduled for today</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Device Alerts</h3>
            <div className="mt-5">
              {deviceData.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {deviceData
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5)
                    .map(data => (
                      <li key={data.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {data.type}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(data.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No recent device alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 