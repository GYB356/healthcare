import { useEffect, useState } from "react";
import axios from "axios";

const SubscriptionStatus = () => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    axios.get("/api/subscription/status").then((res) => setIsActive(res.data.isActive));
  }, []);

  return <p>{isActive ? "You have an active subscription" : "No active subscription"}</p>;
};

export default SubscriptionStatus;
