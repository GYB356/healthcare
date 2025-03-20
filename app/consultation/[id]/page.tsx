'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

interface MedicalHistory {
  id: string;
  date: string;
  diagnosis: string;
  prescription: string;
  notes: string;
}

export default function ConsultationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
  });

  useEffect(() => {
    const fetchConsultationData = async () => {
      try {
        // Fetch appointment details
        const appointmentRes = await fetch(`/api/appointments/${params.id}`, {
          credentials: 'include',
        });
        if (appointmentRes.ok) {
          const data = await appointmentRes.json();
          setAppointment(data.appointment);

          // Fetch patient's medical history
          const historyRes = await fetch(`/api/patients/${data.appointment.patientId}/medical-history`, {
            credentials: 'include',
          });
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setMedicalHistory(historyData.medicalHistory);
          }
        } else {
          setError('Failed to load appointment details');
        }
      } catch (error) {
        console.error('Error fetching consultation data:', error);
        setError('Failed to load consultation data');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultationData();
  }, [params.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    try {
      const response = await fetch(`/api/appointments/${appointment.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/doctor');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to complete consultation');
      }
    } catch (error) {
      console.error('Error completing consultation:', error);
      setError('Failed to complete consultation');
    }
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

  if (!appointment) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Appointment not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Consultation with {appointment.patientName}</h1>
        <div className="text-gray-600">
          {appointment.date} at {appointment.time}
        </div>
      </div>

      {/* Medical History */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Medical History</h2>
        {medicalHistory.length > 0 ? (
          <div className="space-y-4">
            {medicalHistory.map((record) => (
              <div key={record.id} className="border-b pb-4">
                <div className="text-sm text-gray-600 mb-1">{record.date}</div>
                <div className="mb-2">
                  <span className="font-semibold">Diagnosis:</span> {record.diagnosis}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Prescription:</span> {record.prescription}
                </div>
                <div>
                  <span className="font-semibold">Notes:</span> {record.notes}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No previous medical records</p>
        )}
      </div>

      {/* Consultation Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">New Consultation</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis
            </label>
            <input
              type="text"
              id="diagnosis"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="prescription" className="block text-sm font-medium text-gray-700 mb-2">
              Prescription
            </label>
            <textarea
              id="prescription"
              name="prescription"
              value={formData.prescription}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Complete Consultation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 