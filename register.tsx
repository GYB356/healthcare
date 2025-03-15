"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthContext from "../../components/AuthProvider";
import RegisterForm from "../../components/RegisterForm";

export default function RegisterPage() {
  const { user, loading } = useContext(AuthContext)!;
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard"); // Redirect authenticated users
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <RegisterForm />
    </div>
  );
} 