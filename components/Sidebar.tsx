import Link from "next/link";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white shadow-md h-full p-6">
      <h2 className="text-xl font-bold mb-4">Dashboard</h2>
      <ul>
        <li className="mb-2">
          <Link href="/dashboard">🏠 Home</Link>
        </li>
        <li className="mb-2">
          <Link href="/analytics">📊 Analytics</Link>
        </li>
        <li className="mb-2">
          <Link href="/profile">👤 Profile</Link>
        </li>
        <li className="mb-2">
          <Link href="/upgrade">🔒 Upgrade</Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
