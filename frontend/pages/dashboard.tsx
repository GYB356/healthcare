import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setUser(res.data);
        fetchDashboardData(res.data.role);
      })
      .catch(() => router.push("/login"));
  }, []);

  const fetchDashboardData = async (role) => {
    let endpoint = "/api/dashboard/patient";
    if (role === "DOCTOR") endpoint = "/api/dashboard/doctor";
    if (role === "ADMIN") endpoint = "/api/dashboard/admin";

    const res = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    setDashboardData(res.data);
  };

  if (!user || !dashboardData) return <p>Loading...</p>;

  return (
    <div>
      <h1>{user.role} Dashboard</h1>
      <pre>{JSON.stringify(dashboardData, null, 2)}</pre>
    </div>
  );
}