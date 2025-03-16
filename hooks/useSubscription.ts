import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
};

export function useSubscription() {
  const { data, error } = useSWR("/api/user/subscription-status", fetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds
    onError: (err) => console.error("API Error:", err.message),
  });

  return {
    isSubscribed: data?.isSubscribed || false,
    isLoading: !data && !error,
    error,
  };
}
