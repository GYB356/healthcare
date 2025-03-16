import { useEffect, useState } from "react";
import axios from "axios";

export default function Earnings() {
  const [earnings, setEarnings] = useState(0);
  const [payments, setPayments] = useState([]);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    axios
      .get("/api/earnings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setEarnings(res.data.totalEarnings / 100);
        setPayments(res.data.payments);
      })
      .catch((err) => console.error(err));
  }, []);

  const handlePayout = async () => {
    const token = localStorage.getItem("token");

    await axios.post(
      "/api/earnings/payout",
      { amount: Number(amount) * 100 },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Payout Requested!");
  };

  return (
    <div>
      <h1>Doctor Earnings</h1>
      <h2>Total Earnings: ${earnings}</h2>

      <h3>Payment History</h3>
      <ul>
        {payments.map((pay) => (
          <li key={pay.id}>${pay.amount / 100} - {pay.status}</li>
        ))}
      </ul>

      <h3>Request Payout</h3>
      <input
        placeholder="Enter Amount"
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handlePayout}>Request Payout</button>
    </div>
  );
}
