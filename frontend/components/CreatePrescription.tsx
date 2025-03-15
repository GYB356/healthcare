import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface CreatePrescriptionProps {
  appointmentId: string;
  patientId: string;
  onPrescriptionCreated?: () => void;
}

export default function CreatePrescription({ appointmentId, patientId, onPrescriptionCreated }: CreatePrescriptionProps) {
  const [medications, setMedications] = useState<Medication[]>([{ name: "", dosage: "", frequency: "", duration: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { token } = useAuth();

  const handleChange = (index: number, field: keyof Medication, value: string) => {
    const updatedMeds = [...medications];
    updatedMeds[index][field] = value;
    setMedications(updatedMeds);
  };

  const addMedication = () => setMedications([...medications, { name: "", dosage: "", frequency: "", duration: "" }]);

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      const updatedMeds = [...medications];
      updatedMeds.splice(index, 1);
      setMedications(updatedMeds);
    }
  };

  const validateForm = () => {
    for (const med of medications) {
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        setError("Please fill in all medication fields");
        return false;
      }
    }
    setError("");
    return true;
  };

  const createPrescription = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token || localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ appointmentId, patientId, medications }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to create prescription");
      }
      
      if (onPrescriptionCreated) {
        onPrescriptionCreated();
      }
      
      // Reset form after successful submission
      setMedications([{ name: "", dosage: "", frequency: "", duration: "" }]);
      alert(data.message);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the prescription");
      console.error("Error creating prescription:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">Create Prescription</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {medications.map((med, index) => (
          <div key={index} className="p-4 border rounded bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Medication #{index + 1}</h3>
              {medications.length > 1 && (
                <button 
                  onClick={() => removeMedication(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                <input 
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Amoxicillin" 
                  value={med.name} 
                  onChange={(e) => handleChange(index, "name", e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input 
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 500mg" 
                  value={med.dosage} 
                  onChange={(e) => handleChange(index, "dosage", e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <input 
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Twice daily" 
                  value={med.frequency} 
                  onChange={(e) => handleChange(index, "frequency", e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input 
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 7 days" 
                  value={med.duration} 
                  onChange={(e) => handleChange(index, "duration", e.target.value)} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button 
          onClick={addMedication}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 flex items-center justify-center"
        >
          <span className="mr-1">+</span> Add Medication
        </button>
        <button 
          onClick={createPrescription}
          disabled={isSubmitting}
          className={`px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-white flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Creating...' : 'Create Prescription'}
        </button>
      </div>
    </div>
  );
}