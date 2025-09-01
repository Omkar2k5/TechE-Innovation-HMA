// src/pages/Dashboard.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, DollarSign, Activity } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const stats = [
    { id: 1, title: "Total Hotels", value: 42, icon: <Building2 className="h-6 w-6 text-blue-600" /> },
    { id: 2, title: "Active Admins", value: 18, icon: <Users className="h-6 w-6 text-green-600" /> },
    { id: 3, title: "Monthly Revenue", value: "$12,450", icon: <DollarSign className="h-6 w-6 text-yellow-500" /> },
    { id: 4, title: "Active Subscriptions", value: 30, icon: <Activity className="h-6 w-6 text-purple-600" /> },
  ];

  const subscriptionData = [
    { name: "Trial", value: 5, color: "#9CA3AF" },
    { name: "Basic", value: 12, color: "#3B82F6" },
    { name: "Premium", value: 15, color: "#F59E0B" },
    { name: "Enterprise", value: 10, color: "#8B5CF6" },
  ];

  const revenueData = [
    { month: "Jan", revenue: 5000 },
    { month: "Feb", revenue: 7200 },
    { month: "Mar", revenue: 8100 },
    { month: "Apr", revenue: 10200 },
    { month: "May", revenue: 12450 },
  ];

  const activity = [
    { id: 1, text: "Grand Palace Hotel upgraded to Premium Plan", time: "2h ago" },
    { id: 2, text: "New Hotel registered: Sea Breeze Resort", time: "5h ago" },
    { id: 3, text: "Hotel Sunrise Inn subscription expired", time: "1d ago" },
    { id: 4, text: "Emerald Residency activated 10 new users", time: "2d ago" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📊 SuperAdmin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.id} className="shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <h2 className="text-xl font-bold">{stat.value}</h2>
              </div>
              <div className="bg-gray-100 p-2 rounded-full">{stat.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Subscription Breakdown Pie Chart */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Subscription Plans</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend Bar Chart */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <h2 className="font-semibold mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <Bar dataKey="revenue" fill="#3B82F6" />
                <Tooltip />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-md">
        <CardContent className="p-4">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="flex justify-between text-sm">
                <span>{a.text}</span>
                <span className="text-gray-400">{a.time}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
