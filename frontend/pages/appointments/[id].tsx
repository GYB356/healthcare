import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import VideoCall from '../../components/VideoCall';
import Layout from '../../components/Layout';
import ConsultationReport from '../../components/ConsultationReport';
import CreatePrescription from '../../components/CreatePrescription';

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  customerId: string;
  contractorId: string;
  notes?: string;
}

export default function AppointmentDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { token, user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [callEnded, setCallEnded] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  useEffect(() => {
    if (!id || !token) return;

    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/appointments/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch appointment details');
        }

        const data = await response.json();
        setAppointment(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Could not load appointment details');
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, token]);

  const startVideoCall = () => {
    setShowVideoCall(true);
    setCallEnded(false);
  };

  const endVideoCall = () => {
    setShowVideoCall(false);
    setCallEnded(true);
    
    // In a real application, you would get the transcript from the video call
    // For demo purposes, we'll use a sample transcript
    setTranscript(
      "Doctor: Hello, how are you feeling today?\n\n" +
      "Patient: I've been having a persistent cough for about two weeks now, and I'm feeling quite tired.\n\n" +
      "Doctor: I'm sorry to hear that. Have you had any fever or chills?\n\n" +
      "Patient: Yes, I had a low-grade fever for a few days last week, but it's gone now.\n\n" +
      "Doctor: Any shortness of breath or chest pain?\n\n" +
      "Patient: Sometimes I feel a bit short of breath, especially after coughing a lot. No chest pain though.\n\n" +
      "Doctor: Have you been exposed to anyone with COVID-19 or other respiratory infections?\n\n" +
      "Patient: Not that I know of, but I've been going to work and using public transportation.\n\n" +
      "Doctor: Based on your symptoms, it sounds like you might have a respiratory infection. I recommend getting tested for COVID-19 and other respiratory pathogens. In the meantime, get plenty of rest, stay hydrated, and take over-the-counter cough medicine if needed. If your symptoms worsen, especially if you develop severe shortness of breath, please seek immediate medical attention.\n\n" +
      "Patient: Thank you, doctor. Should I schedule a follow-up appointment?\n\n" +
      "Doctor: Yes, let's schedule a follow-up in one week to check on your progress. If your test results come back positive for anything concerning, we may need to adjust our treatment plan."
    );
  };

  const togglePrescriptionForm = () => {
    setShowPrescriptionForm(!showPrescriptionForm);
  };

  const handlePrescriptionCreated = () => {
    setShowPrescriptionForm(false);
    // Optionally refresh appointment data or show a success message
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4">
          <p>Loading appointment details...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  if (!appointment) {
    return (
      <Layout>
        <div className="p-4">
          <p>Appointment not found</p>
          <button
            onClick={() => router.push('/appointments')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            View All Appointments
          </button>
        </div>
      </Layout>
    );
  }

  const isScheduledForToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointment.date === today;
  };

  const canStartVideoCall = () => {
    return (
      appointment.status === 'scheduled' &&
      isScheduledForToday() &&
      (user?.role === 'contractor' || user?.role === 'customer')
    );
  };

  const isDoctor = user?.role === 'contractor';
  const canCreatePrescription = isDoctor && 
    (appointment.status === 'completed' || appointment.status === 'in-progress');

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{appointment.title}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              appointment.status === 'scheduled'
                ? 'bg-blue-100 text-blue-800'
                : appointment.status === 'in-progress'
                ? 'bg-yellow-100 text-yellow-800'
                : appointment.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-600">Date</p>
              <p className="font-medium">{appointment.date}</p>
            </div>
            <div>
              <p className="text-gray-600">Time</p>
              <p className="font-medium">{appointment.time}</p>
            </div>
          </div>

          {appointment.notes && (
            <div className="mb-4">
              <p className="text-gray-600">Notes</p>
              <p className="mt-1">{appointment.notes}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {canStartVideoCall() && !showVideoCall && (
              <button
                onClick={startVideoCall}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Start Video Consultation
              </button>
            )}
            
            {canCreatePrescription && (
              <button
                onClick={togglePrescriptionForm}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
              >
                {showPrescriptionForm ? 'Hide Prescription Form' : 'Create Prescription'}
              </button>
            )}
            
            <button
              onClick={() => router.back()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            >
              Back
            </button>
          </div>
        </div>

        {showVideoCall && (
          <div className="mb-6">
            <VideoCall roomName={`appointment-${appointment.id}`} />
            <button
              onClick={endVideoCall}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              End Call
            </button>
          </div>
        )}

        {showPrescriptionForm && (
          <div className="mb-6">
            <CreatePrescription 
              appointmentId={appointment.id} 
              patientId={appointment.customerId}
              onPrescriptionCreated={handlePrescriptionCreated}
            />
          </div>
        )}

        {callEnded && transcript && (
          <div className="mt-8">
            <ConsultationReport 
              appointmentId={appointment.id} 
              transcript={transcript} 
            />
          </div>
        )}
      </div>
    </Layout>
  );
} 