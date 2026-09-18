import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";

function AdminAnalytics() {
  const [stats, setStats] = useState({ users: 0, chats: 0, matches: 0, revenue: 0 });

  useEffect(() => {
    async function fetchStats() {
      // Replace with your backend analytics endpoint
      const res = await axios.get("https://your-backend-url/api/admin/analytics/overview");
      setStats(res.data);
    }
    fetchStats();
  }, []);

  const barData = {
    labels: ["Users", "Chats", "Matches", "Revenue ($)"],
    datasets: [
      {
        label: "Platform Stats",
        data: [stats.users, stats.chats, stats.matches, stats.revenue],
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0"]
      }
    ]
  };

  const pieData = {
    labels: ["Users", "Chats", "Matches"],
    datasets: [
      {
        data: [stats.users, stats.chats, stats.matches],
        backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56"]
      }
    ]
  };

  return (
    <div>
      <h2>Admin Analytics Dashboard</h2>
      <Bar data={barData} />
      <Pie data={pieData} />
    </div>
  );
}

export default AdminAnalytics;
  
