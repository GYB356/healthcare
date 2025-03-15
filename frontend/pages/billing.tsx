import { useEffect, useState } from "react";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [newInvoice, setNewInvoice] = useState({ patientId: "", amount: "", description: "" });

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await axios.get("/api/billing");
        setInvoices(res.data);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      }
    }
    fetchInvoices();
  }, []);

  const handleCreate = async () => {
    try {
      await axios.post("/api/billing", newInvoice);
      window.location.reload();
    } catch (error) {
      console.error("Failed to create invoice:", error);
    }
  };

  const handlePayment = async (invoice) => {
    const stripe = await stripePromise;
    try {
      const { data } = await axios.post("/api/billing/pay", { amount: invoice.amount, token: { id: "tok_visa" } });
      alert("Payment successful!");
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold">Billing</h2>

      <div className="mt-4">
        <input type="text" placeholder="Patient ID" className="border p-2 m-2" 
               onChange={(e) => setNewInvoice({ ...newInvoice, patientId: e.target.value })} />
        <input type="number" placeholder="Amount" className="border p-2 m-2"
               onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} />
        <input type="text" placeholder="Description" className="border p-2 m-2"
               onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })} />
        <button onClick={handleCreate} className="bg-blue-500 text-white p-2 rounded-lg">Create Invoice</button>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold">Invoices</h3>
        <ul>
          {invoices.map((invoice) => (
            <li key={invoice._id} className="p-2 border-b">
              {invoice.description} - ${invoice.amount} - {invoice.status}
              {invoice.status === "Pending" && (
                <button onClick={() => handlePayment(invoice)} className="ml-4 bg-green-500 text-white p-2 rounded-lg">
                  Pay Now
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 