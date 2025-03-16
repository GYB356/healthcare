import { useEffect, useState } from "react";
import axios from "axios";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [appointmentId, setAppointmentId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/payments/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPayments(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handlePayment = async () => {
    const token = localStorage.getItem("token");

    const res = await axios.post("/api/payments/checkout", { appointmentId }, {
      headers: { Authorization: `Bearer ${token}` },
    });

    window.location.href = res.data.url;
  };

  return (
    <div>
      <h1>My Payments</h1>
      <ul>
        {payments.map((pay) => (
          <li key={pay.id}>{pay.amount / 100}$ - {pay.status}</li>
        ))}
      </ul>

      <h2>Make a Payment</h2>
      <input placeholder="Appointment ID" onChange={(e) => setAppointmentId(e.target.value)} />
      <button onClick={handlePayment}>Pay Now</button>
    </div>
  );
}
