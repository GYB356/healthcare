import { useEffect, useState } from "react";
import axios from "axios";

export default function AdminAnalytics() {
  const [data, setData] = useState({ totalUsers: 0, totalAppointments: 0, totalRevenue: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <p><strong>Total Users:</strong> {data.totalUsers}</p>
      <p><strong>Total Appointments:</strong> {data.totalAppointments}</p>
      <p><strong>Total Revenue:</strong> ${(data.totalRevenue / 100).toFixed(2)}</p>
    </div>
  );
}
