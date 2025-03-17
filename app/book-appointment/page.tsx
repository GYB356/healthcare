'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Doctor {
  id: string;
  name: string;
  department: string;
  availableSlots: string[];
}

interface Department {
  id: string;
  name: string;
}

export default function BookAppointment() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch departments
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments', {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.departments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setError('Failed to load departments');
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    // Fetch doctors when department is selected
    const fetchDoctors = async () => {
      if (!selectedDepartment) return;
      
      try {
        const res = await fetch(`/api/doctors?department=${selectedDepartment}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setError('Failed to load doctors');
      }
    };

    fetchDoctors();
  }, [selectedDepartment]);

  useEffect(() => {
    // Fetch available slots when doctor and date are selected
    const fetchAvailableSlots = async () => {
      if (!selectedDoctor || !selectedDate) return;
      
      try {
        const res = await fetch(`/api/appointments/available-slots?doctorId=${selectedDoctor}&date=${selectedDate}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots);
        }
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setError('Failed to load available time slots');
      }
    };

    fetchAvailableSlots();
  }, [selectedDoctor, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          doctorId: selectedDoctor,
          date: selectedDate,
          time: selectedTime,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/patient?appointment=booked');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Book an Appointment</h1>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <select
            id="department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
            Doctor
          </label>
          <select
            id="doctor"
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            required
            disabled={!selectedDepartment}
          >
            <option value="">Select Doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700">
            Time Slot
          </label>
          <select
            id="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            required
            disabled={!selectedDate || !selectedDoctor}
          >
            <option value="">Select Time Slot</option>
            {availableSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
} 