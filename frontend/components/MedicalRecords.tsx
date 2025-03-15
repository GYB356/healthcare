import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function MedicalRecords() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";
  const canUpload = isAdmin || isDoctor;

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/uploads`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch files");
      }
      
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      setError("Error loading files");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileInputRef.current?.files?.length) {
      return;
    }
    
    const formData = new FormData();
    formData.append("file", fileInputRef.current.files[0]);
    
    setUploadStatus("Uploading...");
    
    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      
      const data = await res.json();
      setUploadStatus("File uploaded successfully!");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Refresh file list
      fetchFiles();
    } catch (err) {
      setUploadStatus("Upload failed");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-4">Loading medical records...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold">Medical Records</h2>
      
      {/* File Upload Form for Doctors and Admins */}
      {canUpload && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="text-md font-semibold mb-2">Upload Medical Record</h3>
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              className="border p-2 flex-grow"
              required
            />
            <button 
              type="submit" 
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Upload
            </button>
          </form>
          {uploadStatus && (
            <p className={`mt-2 ${uploadStatus.includes("failed") ? "text-red-500" : "text-green-500"}`}>
              {uploadStatus}
            </p>
          )}
        </div>
      )}
      
      {/* Role-specific instructions */}
      {isAdmin && (
        <p className="mt-4 text-gray-600 italic">
          As an administrator, you can view and upload all medical records.
        </p>
      )}
      
      {isDoctor && (
        <p className="mt-4 text-gray-600 italic">
          As a doctor, you can view all patient records and upload new ones.
        </p>
      )}
      
      {!canUpload && (
        <p className="mt-4 text-gray-600 italic">
          You can view your medical records below.
        </p>
      )}
      
      {/* File List */}
      <div className="mt-4">
        <h3 className="text-md font-semibold">Available Records</h3>
        {files.length === 0 ? (
          <p className="mt-2 text-gray-500">No medical records available.</p>
        ) : (
          <ul className="mt-2">
            {files.map((file, index) => (
              <li key={index} className="mb-2 p-2 border-b hover:bg-gray-50">
                <a 
                  href={`/api/uploads/${file}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {file}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 