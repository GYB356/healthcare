import { useContext, useState } from "react";
import AuthContext from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user } = useContext(AuthContext)!;
  const [name, setName] = useState(user?.name || "");

  return (
    <div>
      <h1 className="text-2xl font-bold">Profile Settings</h1>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </div>
  );
} 