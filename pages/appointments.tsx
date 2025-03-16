import { useEffect, useState } from "react";
import axios from "axios";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    axios
      .get("/api/appointments", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err));
  }, []);

  const bookAppointment = async () => {
    await axios.post(
      "/api/appointments",
      { doctorId, date, time },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );
  };

  return (
    <div>
      <h1>Appointments</h1>
      <input type="text" placeholder="Doctor ID" value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      <button onClick={bookAppointment}>Book Appointment</button>

      <h2>Your Appointments</h2>
      {appointments.map((appt) => (
        <p key={appt.id}>{appt.date} {appt.time}</p>
      ))}
    </div>
  );
}
