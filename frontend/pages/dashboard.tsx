import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Notifications from "../components/Notifications";
import Chat from "../components/Chat";
import { useAuth } from "../utils/auth";
import { useRouter } from "next/router";
import io from "socket.io-client";

const socket = io("http://localhost:5000"); // Backend URL

export default function Dashboard() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    socket.emit("joinRoom", { userId: user.id });

    socket.on("updateOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => socket.off("updateOnlineUsers");
  }, [user]);

  const startCall = (partnerId) => {
    router.push(`/video-call?partnerId=${partnerId}`);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Welcome, {user.name}</h1>

      {user.role === "doctor" && <DoctorDashboard />}
      {user.role === "patient" && <PatientDashboard />}
      {user.role === "admin" && <AdminDashboard />}

      <h2 className="text-lg font-semibold mt-4">Online Users</h2>
      <ul className="mt-2">
        {onlineUsers.map((onlineUser) => (
          <li key={onlineUser.id} className="flex justify-between items-center p-2 border-b">
            <span>{onlineUser.name}</span>
            <button className="bg-blue-500 text-white px-3 py-1" onClick={() => startCall(onlineUser.id)}>
              Call
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DoctorDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get("/api/dashboard");
        setStats(res.data);

        setChartData([
          { name: "Patients", value: res.data.totalPatients },
          { name: "Appointments", value: res.data.totalAppointments },
          { name: "Pending Claims", value: res.data.pendingClaims },
        ]);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }

    async function fetchPatients() {
      try {
        const res = await axios.get(`/api/patients?search=${search}`);
        setPatients(res.data);
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      }
    }

    fetchStats();
    fetchPatients();
  }, [search]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Welcome, {user?.email}!</h2>
        <div className="flex items-center">
          <Notifications />
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search patients..."
        className="border p-2 mt-4 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Patient List */}
      <div className="mt-6 bg-white p-4 shadow-lg rounded-lg">
        <h3 className="text-lg font-bold">Patient List</h3>
        <ul>
          {patients.map((p) => (
            <li key={p._id} className="p-2 border-b">{p.name}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-blue-500 text-white rounded-lg">
          <h3 className="text-lg font-semibold">Total Patients</h3>
          <p className="text-2xl">{stats?.totalPatients || "Loading..."}</p>
        </div>
        <div className="p-4 bg-green-500 text-white rounded-lg">
          <h3 className="text-lg font-semibold">Appointments</h3>
          <p className="text-2xl">{stats?.totalAppointments || "Loading..."}</p>
        </div>
        <div className="p-4 bg-red-500 text-white rounded-lg">
          <h3 className="text-lg font-semibold">Pending Claims</h3>
          <p className="text-2xl">{stats?.pendingClaims || "Loading..."}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-8 p-4 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-bold mb-4">Healthcare Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chat Component */}
      <div className="mt-8 p-4 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-bold mb-4">Support Chat</h3>
        <div className="h-[400px]">
          <Chat chatId="chat123" userId={user?.id || "user456"} />
        </div>
      </div>

      <button
        onClick={logout}
        className="mt-6 p-2 bg-red-500 text-white rounded-lg"
      >
        Logout
      </button>
    </div>
  );
}

function PatientDashboard() {
  return <p>Patient features here...</p>;
}

function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await axios.get("/api/dashboard");
        setStats(res.data);

        setChartData([
          { name: "Patients", value: res.data.totalPatients },
          { name: "Appointments", value: res.data.totalAppointments },
          { name: "Pending Claims", value: res.data.pendingClaims },
        ]);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }

    async function fetchPatients() {
      try {
        const res = await axios.get(`/api/patients?search=${search}`);
        setPatients(res.data);
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      }
    }

    fetchStats();
    fetchPatients();
  }, [search]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Welcome, {user?.email}!</h2>
        <div className="flex items-center">
          <Notifications />
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search patients..."
        className="border p-2 mt-4 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Patient List */}
      <div className="mt-6 bg-white p-4 shadow-lg rounded-lg">
        <h3 className="text-lg font-bold">Patient List</h3>
        <ul>
          {patients.map((p) => (
            <li key={p._id} className="p-2 border-b">{p.name}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-blue-500 text-white rounded-lg">
          <h3 className="text-lg font-semibold">Total Patients</h3>
          <p className="text-2xl">{stats?.totalPatients || "Loading..."}</p>
        </div>
        <div className="p-4 bg-green-500 text-white rounded-lg">
          <h3 className="text-lg font-semibold">Appointments</h3>
          <p className="text-2xl">{stats?.totalAppointments || "Loading..."}</p>
        </div>
        <div className="p-4 bg-red-500 text-white rounded-lg">
          <h3 className="text-lg font-semibold">Pending Claims</h3>
          <p className="text-2xl">{stats?.pendingClaims || "Loading..."}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-8 p-4 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-bold mb-4">Healthcare Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chat Component */}
      <div className="mt-8 p-4 bg-white shadow-lg rounded-lg">
        <h3 className="text-xl font-bold mb-4">Support Chat</h3>
        <div className="h-[400px]">
          <Chat chatId="chat123" userId={user?.id || "user456"} />
        </div>
      </div>

      <button
        onClick={logout}
        className="mt-6 p-2 bg-red-500 text-white rounded-lg"
      >
        Logout
      </button>
    </div>
  );
}