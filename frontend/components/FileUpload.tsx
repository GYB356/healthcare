import { useState } from "react";
import axios from "axios";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return setMessage("Please select a file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/uploads/upload", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessage("File uploaded successfully!");
    } catch (error) {
      setMessage("Upload failed");
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      <p>{message}</p>
    </div>
  );
}
