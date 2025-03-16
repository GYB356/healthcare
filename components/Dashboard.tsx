import { useSubscription } from "../hooks/useSubscription";

export default function Dashboard() {
  const { isSubscribed, isLoading, error } = useSubscription();

  if (isLoading) return <p>Loading subscription status...</p>;
  if (error) return <p style={{ color: "red" }}>Error loading subscription!</p>;

  return (
    <div className="dashboard">
      <h1>Welcome to Your Dashboard</h1>
      <div className={`subscription-status ${isSubscribed ? "active" : "inactive"}`}>
        {isSubscribed ? "✅ Subscription Active" : "❌ Subscription Inactive"}
      </div>
    </div>
  );
}
