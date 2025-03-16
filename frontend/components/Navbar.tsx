import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  return (
    <nav>
      <Link href="/">Home</Link>
      {user && (
        <>
          <Link href="/dashboard">Dashboard</Link>
          {user.role === "ADMIN" && <Link href="/admin">Admin Panel</Link>}
          {user.role === "DOCTOR" && <Link href="/doctor/patients">My Patients</Link>}
        </>
      )}
      {!user ? <Link href="/login">Login</Link> : <button onClick={() => localStorage.removeItem("token")}>Logout</button>}
    </nav>
  );
}
