"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthContext from "../AuthProvider";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useContext(AuthContext)!;
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login"); // Redirect if not authenticated
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 