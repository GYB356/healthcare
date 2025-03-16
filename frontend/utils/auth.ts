import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export function useAuth(allowedRoles) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.get("/api/auth/me");
        if (allowedRoles.includes(data.role)) {
          setAuthorized(true);
        } else {
          router.push("/unauthorized");
        }
      } catch {
        router.push("/login");
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  return { loading, authorized };
}
