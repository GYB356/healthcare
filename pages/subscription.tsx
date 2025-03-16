import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axios from "axios";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const SubscriptionForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("basic");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data } = await axios.post("/api/subscribe", { plan });

    const result = await stripe?.confirmCardPayment(data.clientSecret, {
      payment_method: { card: elements?.getElement(CardElement)! },
    });

    setLoading(false);
    if (result?.error) {
      alert(result.error.message);
    } else {
      alert("Subscription successful!");
    }
  };

  return (
    <form onSubmit={handleSubscribe}>
      <select value={plan} onChange={(e) => setPlan(e.target.value)}>
        <option value="basic">Basic - $10</option>
        <option value="pro">Pro - $20</option>
        <option value="enterprise">Enterprise - $50</option>
      </select>
      <CardElement />
      <button type="submit" disabled={!stripe || loading}>Subscribe</button>
    </form>
  );
};

export default function SubscriptionPage() {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionForm />
    </Elements>
  );
}
