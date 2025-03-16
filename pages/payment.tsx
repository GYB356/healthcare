import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import axios from "axios";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data } = await axios.post("/api/create-payment-intent", { amount: 5000, currency: "usd" });
    setPaymentIntentId(data.id);

    const result = await stripe?.confirmCardPayment(data.clientSecret, {
      payment_method: { card: elements?.getElement(CardElement)! },
    });

    setLoading(false);
    if (result?.error) {
      alert(result.error.message);
    } else {
      alert("Payment successful!");
    }
  };

  const retrievePaymentIntent = async () => {
    if (!paymentIntentId) return;

    const { data } = await axios.get(`/api/retrieve-payment-intent/${paymentIntentId}`);
    setPaymentStatus(data.status);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <CardElement />
        <button type="submit" disabled={!stripe || loading}>Pay</button>
      </form>
      {paymentIntentId && (
        <div>
          <button onClick={retrievePaymentIntent}>Check Payment Status</button>
          {paymentStatus && <p>Payment Status: {paymentStatus}</p>}
        </div>
      )}
    </div>
  );
};

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
