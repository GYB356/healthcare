'use client';

import { useEffect, useState } from 'react';
import { Appointment, BillingRecord, StaffSchedule } from '@/types';
import {
  CalendarIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function StaffDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [staffSchedule, setStaffSchedule] = useState<StaffSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [appointmentsRes, billingRecordsRes, staffScheduleRes] = await Promise.all([
          fetch('/api/staff/appointments'),
          fetch('/api/staff/billing'),
          fetch('/api/staff/schedule'),
        ]);

        if (appointmentsRes.ok) {
          const data = await appointmentsRes.json();
          setAppointments(data.appointments);
        }

        if (billingRecordsRes.ok) {
          const data = await billingRecordsRes.json();
          setBillingRecords(data.records);
        }

        if (staffScheduleRes.ok) {
          const data = await staffScheduleRes.json();
          setStaffSchedule(data.schedule);
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
      <h1 className="text-2xl font-semibold text-gray-900">Staff Dashboard</h1>

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
                <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Staff on Duty</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {staffSchedule.filter(s => 
                      s.status === 'scheduled' && 
                      new Date(s.date).toDateString() === new Date().toDateString()
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Set(appointments.map(a => a.patientId)).size}
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
            <h3 className="text-lg font-medium leading-6 text-gray-900">Pending Payments</h3>
            <div className="mt-5">
              {billingRecords.filter(b => b.status === 'pending').length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {billingRecords
                    .filter(b => b.status === 'pending')
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 5)
                    .map(record => (
                      <li key={record.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              ${record.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Due: {new Date(record.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No pending payments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 