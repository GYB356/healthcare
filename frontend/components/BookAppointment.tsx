import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface Doctor {
  _id: string;
  email: string;
  name?: string;
}

export default function BookAppointment() {
  const { user, token } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/users/doctors", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch doctors");
        }
        
        const data = await res.json();
        setDoctors(data);
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setMessage({ text: "Failed to load doctors. Please try again later.", type: "error" });
      }
    };

    if (token) {
      fetchDoctors();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    
    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ doctorId: selectedDoctor, date, notes }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to book appointment");
      }
      
      setMessage({ text: data.message, type: "success" });
      
      // Reset form
      setSelectedDoctor("");
      setDate("");
      setNotes("");
    } catch (error) {
      console.error("Error booking appointment:", error);
      setMessage({ 
        text: error instanceof Error ? error.message : "Failed to book appointment", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate min date (today) for the datetime picker
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-white">
      <h2 className="text-xl font-bold mb-4">Book an Appointment</h2>
      
      {message.text && (
        <div className={`p-3 mb-4 rounded ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="doctor" className="block text-sm font-medium text-gray-700 mb-1">
            Select Doctor
          </label>
          <select 
            id="doctor"
            value={selectedDoctor} 
            onChange={(e) => setSelectedDoctor(e.target.value)} 
            required
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a Doctor</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name || doc.email}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date and Time
          </label>
          <input 
            id="date"
            type="datetime-local" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            min={minDate}
            required
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Visit
          </label>
          <textarea 
            id="notes"
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Please describe your symptoms or reason for the appointment"
            rows={4}
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
} 