import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));

    axios
      .get("/api/admin/payouts", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setPayouts(res.data))
      .catch((err) => console.error(err));

    socket.on("notification", (message) => {
      setNotifications((prev) => [...prev, message]);
    });

    return () => socket.off("notification");
  }, []);

  const handlePayoutAction = async (id, status) => {
    const token = localStorage.getItem("token");

    await axios.put(
      `/api/admin/payouts/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert(`Payout ${status.toLowerCase()} successfully!`);
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <h2>Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email} ({user.role})
          </li>
        ))}
      </ul>

      <h2>Payout Requests</h2>
      <ul>
        {payouts.map((payout) => (
          <li key={payout.id}>
            Dr. {payout.doctor.name} - ${payout.amount / 100} - {payout.status}
            {payout.status === "PENDING" && (
              <>
                <button onClick={() => handlePayoutAction(payout.id, "APPROVED")}>Approve</button>
                <button onClick={() => handlePayoutAction(payout.id, "REJECTED")}>Reject</button>
              </>
            )}
          </li>
        ))}
      </ul>

      <h2>Notifications</h2>
      {notifications.map((note, index) => (
        <p key={index}>{note}</p>
      ))}
    </div>
  );
}
