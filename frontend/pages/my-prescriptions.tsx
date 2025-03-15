import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import PrescriptionDetails from "../components/PrescriptionDetails";
import { useRouter } from "next/router";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Doctor {
  _id: string;
  name: string;
  email?: string;
}

interface Prescription {
  _id: string;
  appointmentId: string;
  doctor: Doctor;
  patient: string;
  medications: Medication[];
  signedByDoctor: boolean;
  signature?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token || !user) {
      router.push("/login");
      return;
    }

    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/prescriptions/patient/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch prescriptions");
        }

        const data = await res.json();
        setPrescriptions(data);
      } catch (err: any) {
        console.error("Error fetching prescriptions:", err);
        setError(err.message || "Failed to load prescriptions");
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, [token, user, router]);

  const downloadPrescription = (prescription: Prescription) => {
    if (!prescription.signedByDoctor) {
      alert("This prescription has not been signed by the doctor yet.");
      return;
    }

    // Create a text representation of the prescription
    const prescriptionText = `
MEDICAL PRESCRIPTION
--------------------

Doctor: ${prescription.doctor.name}
Date: ${new Date(prescription.createdAt).toLocaleDateString()}
${prescription.signature ? `\n${prescription.signature}` : ''}

MEDICATIONS:
${prescription.medications.map(med => 
  `- ${med.name} (${med.dosage})
   Take: ${med.frequency}
   Duration: ${med.duration}`
).join('\n\n')}

This prescription was generated on ${new Date().toLocaleString()}
    `;

    // Create a blob and download it
    const blob = new Blob([prescriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${prescription._id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewPrescriptionDetails = (prescriptionId: string) => {
    setSelectedPrescription(prescriptionId);
  };

  const closeDetails = () => {
    setSelectedPrescription(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-4 text-center">
          <p>Loading your prescriptions...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Prescriptions</h1>
          {selectedPrescription && (
            <button
              onClick={closeDetails}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
            >
              Back to List
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {selectedPrescription ? (
          <PrescriptionDetails prescriptionId={selectedPrescription} />
        ) : (
          <>
            {prescriptions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 mb-4">You don't have any prescriptions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((prescription) => (
                  <div 
                    key={prescription._id} 
                    className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-lg">
                          Prescription from Dr. {prescription.doctor.name}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          prescription.signedByDoctor 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {prescription.signedByDoctor ? '✓ Signed' : '⚠ Awaiting Signature'}
                      </span>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Medications:</h4>
                      <ul className="space-y-1 pl-2">
                        {prescription.medications.map((med, index) => (
                          <li key={index} className="text-sm">
                            <span className="font-medium">{med.name}</span> - {med.dosage}, {med.frequency}, {med.duration}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={() => viewPrescriptionDetails(prescription._id)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => downloadPrescription(prescription)}
                        disabled={!prescription.signedByDoctor}
                        className={`px-3 py-1 text-sm rounded ${
                          prescription.signedByDoctor
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
} 