import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import SignPrescription from "./SignPrescription";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
}

interface Prescription {
  _id: string;
  appointmentId: string;
  doctor: Doctor | string;
  patient: string;
  medications: Medication[];
  signedByDoctor: boolean;
  signature?: string;
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionDetailsProps {
  prescriptionId: string;
}

export default function PrescriptionDetails({ prescriptionId }: PrescriptionDetailsProps) {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, user } = useAuth();

  useEffect(() => {
    if (!prescriptionId) return;

    const fetchPrescription = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/prescriptions/${prescriptionId}`, {
          headers: { Authorization: `Bearer ${token || localStorage.getItem("token")}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch prescription");
        }

        const data = await res.json();
        setPrescription(data);
      } catch (err: any) {
        console.error("Error fetching prescription:", err);
        setError(err.message || "Failed to load prescription details");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [prescriptionId, token]);

  const handlePrescriptionSigned = () => {
    // Refresh prescription data after signing
    if (prescription) {
      setPrescription({
        ...prescription,
        signedByDoctor: true,
        signature: `Signed by Dr. ${user?.name} on ${new Date().toISOString()}`
      });
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading prescription details...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!prescription) {
    return <div className="p-4">Prescription not found</div>;
  }

  const isDoctor = user?.role === 'contractor';
  const canSign = isDoctor && !prescription.signedByDoctor && 
    (typeof prescription.doctor === 'string' 
      ? prescription.doctor === user?.id 
      : prescription.doctor._id === user?.id);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Prescription Details</h2>
        <span className={`px-3 py-1 rounded-full text-sm ${
          prescription.signedByDoctor 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {prescription.signedByDoctor ? 'Signed' : 'Unsigned'}
        </span>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-gray-600">Doctor</p>
            <p className="font-medium">
              {typeof prescription.doctor === 'string' 
                ? 'Doctor information not available' 
                : prescription.doctor.name}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Date Prescribed</p>
            <p className="font-medium">
              {new Date(prescription.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {prescription.signature && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">{prescription.signature}</p>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Medications</h3>
        <div className="space-y-4">
          {prescription.medications.map((med, index) => (
            <div key={index} className="p-4 border rounded bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Medication</p>
                  <p className="font-medium">{med.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dosage</p>
                  <p className="font-medium">{med.dosage}</p>
                </div>
                <div>
                  <p className="text-gray-600">Frequency</p>
                  <p className="font-medium">{med.frequency}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium">{med.duration}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {canSign && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-gray-700">
            Please review the prescription details before signing.
          </p>
          <SignPrescription 
            prescriptionId={prescription._id} 
            onPrescriptionSigned={handlePrescriptionSigned}
          />
        </div>
      )}
    </div>
  );
} 