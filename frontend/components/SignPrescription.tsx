import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface SignPrescriptionProps {
  prescriptionId: string;
  onPrescriptionSigned?: () => void;
}

export default function SignPrescription({ prescriptionId, onPrescriptionSigned }: SignPrescriptionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { token } = useAuth();

  const signPrescription = async () => {
    if (!prescriptionId) {
      setError("Prescription ID is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}/sign`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token || localStorage.getItem("token")}` 
        },
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to sign prescription");
      }
      
      setSuccess(data.message || "Prescription signed successfully");
      
      if (onPrescriptionSigned) {
        onPrescriptionSigned();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while signing the prescription");
      console.error("Error signing prescription:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2">
      {error && (
        <div className="mb-2 p-2 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-2 p-2 bg-green-50 text-green-700 border border-green-200 rounded text-sm">
          {success}
        </div>
      )}
      
      <button 
        onClick={signPrescription}
        disabled={isSubmitting}
        className={`px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center ${
          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
        }`}
      >
        {isSubmitting ? (
          <span>Signing...</span>
        ) : (
          <>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 11l5-5m0 0l5 5m-5-5v12" 
              />
            </svg>
            Sign Prescription
          </>
        )}
      </button>
    </div>
  );
} 