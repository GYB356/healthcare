import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const withSubscription = (WrappedComponent: any) => {
  return (props: any) => {
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const router = useRouter();

    useEffect(() => {
      axios
        .get("/api/user/subscription-status")
        .then((res) => {
          if (res.data.isSubscribed) {
            setIsSubscribed(true);
          } else {
            router.push("/upgrade");
          }
        })
        .catch(() => router.push("/upgrade"))
        .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading...</p>;
    return isSubscribed ? <WrappedComponent {...props} /> : null;
  };
};

export default withSubscription;
