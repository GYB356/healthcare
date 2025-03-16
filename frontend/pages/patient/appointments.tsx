import { useEffect, useState } from "react";
import axios from "axios";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/appointments/patient", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleBooking = async () => {
    const token = localStorage.getItem("token");

    await axios.post("/api/appointments", { doctorId, date, reason }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    window.location.reload();
  };

  return (
    <div>
      <h1>My Appointments</h1>
      <ul>
        {appointments.map((appt) => (
          <li key={appt.id}>{appt.date} - {appt.status}</li>
        ))}
      </ul>

      <h2>Book a New Appointment</h2>
      <input placeholder="Doctor ID" onChange={(e) => setDoctorId(e.target.value)} />
      <input type="date" onChange={(e) => setDate(e.target.value)} />
      <input placeholder="Reason" onChange={(e) => setReason(e.target.value)} />
      <button onClick={handleBooking}>Book Appointment</button>
    </div>
  );
}
