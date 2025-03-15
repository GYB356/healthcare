import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Users, DollarSign } from "lucide-react";

const stats = [
  { title: "Total Revenue", value: "$124,500", icon: <DollarSign size={24} /> },
  { title: "Active Users", value: "1,250", icon: <Users size={24} /> },
  { title: "New Signups", value: "350", icon: <BarChart size={24} /> },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-4 flex items-center space-x-4">
            {stat.icon}
            <CardContent>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-lg font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 