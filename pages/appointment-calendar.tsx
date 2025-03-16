import { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function AppointmentCalendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("/api/appointments", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setEvents(
          res.data.map((appt) => ({
            title: `Doctor ${appt.doctorId}`,
            start: `${appt.date}T${appt.time}`,
          }))
        );
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Appointment Calendar</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
      />
    </div>
  );
}
