import { useRouter } from "next/navigation";
import { Home, User, BarChart, LogOut } from "lucide-react";
import { useContext } from "react";
import AuthContext from "./AuthProvider";

const Sidebar = () => {
  const { logout } = useContext(AuthContext)!;
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, path: "/dashboard" },
    { name: "Profile", icon: <User size={20} />, path: "/dashboard/profile" },
    { name: "Analytics", icon: <BarChart size={20} />, path: "/dashboard/analytics" },
  ];

  return (
    <aside className="w-64 bg-white border-r p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-6">RevenueMD</h2>
      <nav>
        {menuItems.map((item) => (
          <button
            key={item.name}
            className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 w-full"
            onClick={() => router.push(item.path)}
          >
            {item.icon}
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      <button
        className="mt-auto flex items-center space-x-2 p-3 text-red-600 hover:bg-red-100 rounded-lg"
        onClick={logout}
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar; 