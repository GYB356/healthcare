import axios from "axios";
import { useRouter } from "next/router";

const UpgradePage = () => {
  const router = useRouter();

  const handleUpgrade = async () => {
    const res = await axios.post("/api/checkout");
    window.location.href = res.data.url; // Redirect to Stripe
  };

  return (
    <div>
      <h1>Upgrade to Premium</h1>
      <p>Access exclusive features by subscribing.</p>
      <button onClick={handleUpgrade}>Upgrade Now</button>
    </div>
  );
};

export default UpgradePage;
