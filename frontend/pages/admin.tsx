import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data.role !== "ADMIN") {
          router.push("/");
        } else {
          setUser(res.data);
        }
      })
      .catch(() => router.push("/"));
  }, []);

  if (!user) return <p>Loading...</p>;

  return <h1>Welcome, Admin!</h1>;
}
