import { useEffect, useState } from "react";
import axios from "axios";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/appointments/doctor", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleAction = async (id, action) => {
    const token = localStorage.getItem("token");

    await axios.put(`/api/appointments/${id}/${action}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });

    window.location.reload();
  };

  return (
    <div>
      <h1>My Appointments</h1>
      <ul>
        {appointments.map((appt) => (
          <li key={appt.id}>
            {appt.date} - {appt.status}
            {appt.status === "PENDING" && (
              <>
                <button onClick={() => handleAction(appt.id, "approve")}>Approve</button>
                <button onClick={() => handleAction(appt.id, "reject")}>Reject</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
