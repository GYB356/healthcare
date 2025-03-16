import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import PremiumFeature from "./PremiumFeature";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    axios.get("/api/user/subscription-status").then((res) => {
      setIsSubscribed(res.data.isSubscribed);
    });
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-100">
        {children}
        {isSubscribed && <PremiumFeature />}
      </main>
    </div>
  );
};

export default DashboardLayout;
