import { useEffect, useState } from "react";
import axios from "axios";

export default function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await axios.get("/api/uploads", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setReports(data.files);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      }
    };
    fetchReports();
  }, []);

  const generateSignedUrl = async (filename) => {
    try {
      const { data } = await axios.get(`/api/uploads/file/${filename}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return data.signedUrl;
    } catch (error) {
      console.error("Failed to generate signed URL:", error);
      return "#";
    }
  };

  return (
    <div>
      <h1>Medical Reports</h1>
      {reports.map((report) => (
        <div key={report}>
          <a href="#" onClick={async (e) => {
            e.preventDefault();
            const url = await generateSignedUrl(report);
            window.open(url, "_blank");
          }}>
            {report}
          </a>
        </div>
      ))}
    </div>
  );
}
