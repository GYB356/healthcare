import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useRouter } from "next/router";
import "../styles/globals.css";

const protectedRoutes = ["/dashboard", "/patients", "/reports"];

export default function MyApp({ Component, pageProps }) {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!user && protectedRoutes.includes(router.pathname)) {
      router.push("/login");
    }
  }, [user, router.pathname]);

  return <Component {...pageProps} />;
} 