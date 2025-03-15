import React, { useEffect } from "react";
import { useRouter } from "next/router";
import "../styles/globals.css";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import socket from "../utils/socket";

const protectedRoutes = ["/dashboard", "/patients", "/reports", "/appointments", "/my-prescriptions", "/projects"];

function AppContent({ Component, pageProps }) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && protectedRoutes.includes(router.pathname)) {
      router.push("/login");
    }
  }, [user, router.pathname]);

  // Handle socket connection based on authentication state
  useEffect(() => {
    if (user) {
      // Join a room with the user's ID for receiving notifications
      socket.emit('joinRoom', user.id);
      console.log(`User joined room: ${user.id}`);
      
      return () => {
        // No need to disconnect, socket will handle reconnection automatically
      };
    }
  }, [user]);

  // Determine if the current route should use the layout
  const isPublicPage = ['/login', '/register'].includes(router.pathname);

  if (isPublicPage) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </AuthProvider>
  );
} 