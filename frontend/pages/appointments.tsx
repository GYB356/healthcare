import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import VideoCall from "../components/VideoCall";
import Layout from "../components/Layout";
import MedicalReport from "../components/MedicalReport";

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialty?: string;
}

interface Patient {
  _id: string;
  name: string;
  email: string;
}

interface Appointment {
  _id: string;
  doctor: Doctor;
  patient: Patient;
  date: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export default function Appointments() {
  const { token, user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    fetch("/api/appointments", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch appointments");
        }
        return res.json();
      })
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching appointments:", err);
        setError(err.message || "Failed to load appointments");
        setLoading(false);
      });
  }, [token]);

  const joinCall = (appointmentId: string) => {
    setActiveRoom(appointmentId);
  };

  const endCall = () => {
    setActiveRoom(null);
  };

  const viewReport = (appointmentId: string) => {
    setActiveAppointment(appointmentId);
  };

  const closeReport = () => {
    setActiveAppointment(null);
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const appointmentDate = new Date(dateString);
    return (
      appointmentDate.getDate() === today.getDate() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getFullYear() === today.getFullYear()
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isDoctor = user?.role === 'contractor';
  const isPatient = user?.role === 'customer';

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <p>Loading appointments...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Appointments</h1>
          {isPatient && (
            <button
              onClick={() => window.location.href = '/appointments/new'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Schedule New Appointment
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {activeAppointment && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Medical Report</h2>
                <button
                  onClick={closeReport}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <MedicalReport 
                appointmentId={activeAppointment} 
                onReportGenerated={() => {
                  // Optionally refresh appointments or update UI after report generation
                }}
              />
            </div>
          </div>
        )}

        {activeRoom ? (
          <div className="mb-6">
            <VideoCall roomName={activeRoom} />
            <div className="mt-4 text-center">
              <button
                onClick={endCall}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
              >
                Return to Appointments
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {appointments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-4">You don't have any appointments yet.</p>
                {isPatient && (
                  <button
                    onClick={() => window.location.href = '/appointments/new'}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                  >
                    Schedule Your First Appointment
                  </button>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {isDoctor && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                    )}
                    {isPatient && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
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
                    <tr key={appointment._id} className="hover:bg-gray-50">
                      {isDoctor && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.patient.email}
                          </div>
                        </td>
                      )}
                      {isPatient && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.doctor.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.doctor.specialty || "General Practitioner"}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(appointment.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                            appointment.status
                          )}`}
                        >
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={`/appointments/${appointment._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </a>
                        {isToday(appointment.date) && appointment.status === 'scheduled' && (
                          <button
                            onClick={() => joinCall(appointment._id)}
                            className="text-green-600 hover:text-green-900 font-medium mr-3"
                          >
                            Join Call
                          </button>
                        )}
                        {(appointment.status === 'completed' || appointment.status === 'in-progress') && (
                          <button
                            onClick={() => viewReport(appointment._id)}
                            className="text-purple-600 hover:text-purple-900 font-medium"
                          >
                            {isDoctor ? "Generate Report" : "View Report"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
} 