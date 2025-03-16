import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";

export function withAuth(Component, requiredRole) {
  return function ProtectedRoute(props) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || (requiredRole && user.role !== requiredRole))) {
        router.push("/login");
      }
    }, [user, loading]);

    return loading ? <p>Loading...</p> : <Component {...props} />;
  };
}
