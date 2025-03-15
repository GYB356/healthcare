import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Patient {
  _id: string;
  email: string;
  name?: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  date: string;
  notes?: string;
  status: "pending" | "approved" | "rejected";
}

export default function DoctorDashboard() {
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/appointments", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch appointments");
        return res.json();
      })
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load appointments");
        setLoading(false);
      });
  }, [token]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      // Update local state
      setAppointments(appointments.map(appointment => 
        appointment._id === id ? { ...appointment, status } : appointment
      ));
    } catch (error) {
      alert("Failed to update appointment status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <div className="p-4">Loading appointments...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  // Group appointments by status
  const pendingAppointments = appointments.filter(app => app.status === "pending");
  const approvedAppointments = appointments.filter(app => app.status === "approved");
  const rejectedAppointments = appointments.filter(app => app.status === "rejected");

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Doctor's Dashboard</h2>
      
      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <div className="space-y-6">
          {/* Pending Appointments */}
          {pendingAppointments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-orange-600">Pending Appointments</h3>
              <ul className="space-y-3">
                {pendingAppointments.map((appointment) => (
                  <li key={appointment._id} className="border p-3 rounded bg-orange-50">
                    <p><strong>Patient:</strong> {appointment.patient.email}</p>
                    <p><strong>Date:</strong> {new Date(appointment.date).toLocaleString()}</p>
                    {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                    <p><strong>Status:</strong> {appointment.status}</p>
                    <div className="mt-2 space-x-2">
                      <button 
                        onClick={() => updateStatus(appointment._id, "approved")}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => updateStatus(appointment._id, "rejected")}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Approved Appointments */}
          {approvedAppointments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-600">Approved Appointments</h3>
              <ul className="space-y-2">
                {approvedAppointments.map((appointment) => (
                  <li key={appointment._id} className="border p-3 rounded bg-green-50">
                    <p><strong>Patient:</strong> {appointment.patient.email}</p>
                    <p><strong>Date:</strong> {new Date(appointment.date).toLocaleString()}</p>
                    {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                    <p><strong>Status:</strong> {appointment.status}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Rejected Appointments */}
          {rejectedAppointments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">Rejected Appointments</h3>
              <ul className="space-y-2">
                {rejectedAppointments.map((appointment) => (
                  <li key={appointment._id} className="border p-3 rounded bg-red-50">
                    <p><strong>Patient:</strong> {appointment.patient.email}</p>
                    <p><strong>Date:</strong> {new Date(appointment.date).toLocaleString()}</p>
                    {appointment.notes && <p><strong>Notes:</strong> {appointment.notes}</p>}
                    <p><strong>Status:</strong> {appointment.status}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}