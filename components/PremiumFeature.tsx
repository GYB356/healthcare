import { useEffect, useState } from "react";
import axios from "axios";

const PremiumFeature = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    axios.get("/api/user/subscription-status").then((res) => {
      setIsSubscribed(res.data.isSubscribed);
    });
  }, []);

  if (!isSubscribed) {
    return <p>🔒 Upgrade to access premium features.</p>;
  }

  return <p>✅ Welcome to premium content!</p>;
};

export default PremiumFeature;
