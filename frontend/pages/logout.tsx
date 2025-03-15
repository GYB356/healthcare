import { useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Logout() {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    logout();
  }, []);

  return <p>Logging out...</p>;
} 