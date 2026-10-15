import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import supabase from "../supabaseClient";
import { adminFetch } from "../utils/adminApi";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function AdminAnalytics() {
  const [userStats, setUserStats] = useState(null);
  const [subStats, setSubStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in first.");
          setLoading(false);
          return;
        }
        const { data: p } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        if (!p || p.role !== "admin") {
          setError("Access denied. Admin only.");
          setLoading(false);
          return;
        }
        await loadData();
      } catch (err) {
        console.error(err);
        setError("Could not load analytics.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, subRes, usersRes] = await Promise.all([
        adminFetch("/profile/admin/stats").catch(() => null),
        adminFetch("/subscriptions/admin/stats").catch(() => null),
        adminFetch("/profile/admin/users?limit=500").catch(() => null),
      ]);

      if (statsRes && statsRes.ok) setUserStats(await statsRes.json());
      if (subRes && subRes.ok) setSubStats(await subRes.json());
      if (usersRes && usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#666" }}>
        Loading analytics... ⏳
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <p style={{ color: "#b91c1c", fontSize: 18 }}>⚠️ {error}</p>
        <Link to="/" style={{ color: "#1e3a8a", fontWeight: "bold" }}>
          ← Go Home
        </Link>
      </div>
    );
  }

  // ============================================
  // COMPUTE ANALYTICS
  // ============================================
  const totalUsers = userStats?.totalUsers || 0;
  const maleUsers = userStats?.maleUsers || 0;
  const femaleUsers = userStats?.femaleUsers || 0;
  const verifiedUsers = userStats?.verifiedUsers || 0;
  const suspendedUsers = userStats?.suspendedUsers || 0;
  const boostedUsers = userStats?.boostedUsers || 0;

  const activeSubs = subStats?.activeSubscriptions || 0;
  const goldCount = subStats?.goldCount || 0;
  const platinumCount = subStats?.platinumCount || 0;
  const mrr = subStats?.mrr || 0;
  const totalRevenue = subStats?.totalRevenue || 0;

  // Age distribution
  const ageBuckets = { "18-25": 0, "26-30": 0, "31-35": 0, "36-40": 0, "41+": 0 };
  users.forEach((u) => {
    const age = parseInt(u.age) || 0;
    if (age >= 18 && age <= 25) ageBuckets["18-25"]++;
    else if (age >= 26 && age <= 30) ageBuckets["26-30"]++;
    else if (age >= 31 && age <= 35) ageBuckets["31-35"]++;
    else if (age >= 36 && age <= 40) ageBuckets["36-40"]++;
    else if (age > 40) ageBuckets["41+"]++;
  });

  // Community distribution
  const communityMap = {};
  users.forEach((u) => {
    const c = u.community || "Not specified";
    communityMap[c] = (communityMap[c] || 0) + 1;
  });
  const topCommunities = Object.entries(communityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Location distribution
  const locationMap = {};
  users.forEach((u) => {
    const l = u.location || "Not specified";
    locationMap[l] = (locationMap[l] || 0) + 1;
  });
  const topLocations = Object.entries(locationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // ============================================
  // CHARTS
  // ============================================
  const barData = {
    labels: ["Total Users", "Male", "Female", "Verified", "Boosted", "Suspended"],
    datasets: [
      {
        label: "User Stats",
        data: [
          totalUsers,
          maleUsers,
          femaleUsers,
          verifiedUsers,
          boostedUsers,
          suspendedUsers,
        ],
        backgroundColor: [
          "#1e3a8a",
          "#2563eb",
          "#db2777",
          "#16a34a",
          "#f59e0b",
          "#dc2626",
        ],
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "User Statistics",
        font: { size: 14, weight: "bold" },
        color: "#1e3a8a",
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const genderPieData = {
    labels: ["Male", "Female", "Other"],
    datasets: [
      {
        data: [
          maleUsers,
          femaleUsers,
          Math.max(0, totalUsers - maleUsers - femaleUsers),
        ],
        backgroundColor: ["#2563eb", "#db2777", "#6b7280"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      title: {
        display: true,
        text: "Gender Distribution",
        font: { size: 14, weight: "bold" },
        color: "#1e3a8a",
      },
    },
  };

  const subsPieData = {
    labels: ["Free", "Gold", "Platinum"],
    datasets: [
      {
        data: [
          Math.max(0, totalUsers - goldCount - platinumCount),
          goldCount,
          platinumCount,
        ],
        backgroundColor: ["#e5e7eb", "#f59e0b", "#db2777"],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const ageBarData = {
    labels: Object.keys(ageBuckets),
    datasets: [
      {
        label: "Users",
        data: Object.values(ageBuckets),
        backgroundColor: "#8B0A2E",
        borderRadius: 6,
      },
    ],
  };

  const ageOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Age Distribution",
        font: { size: 14, weight: "bold" },
        color: "#8B0A2E",
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  // ============================================
  // STYLES
  // ============================================
  const S = {
    page: { maxWidth: 1400, margin: "0 auto", padding: "24px 16px" },
    h1: { color: "#1e3a8a", fontSize: 28, margin: "0 0 4px 0" },
    sub: { color: "#666", fontSize: 14, margin: 0 },
    statGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: 12,
      marginBottom: 24,
    },
    stat: {
      background: "white",
      borderRadius: 12,
      padding: 16,
      textAlign: "center",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    },
    chartGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
      gap: 20,
      marginBottom: 24,
    },
    chartCard: {
      background: "white",
      borderRadius: 12,
      padding: 20,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    },
    listCard: {
      background: "white",
      borderRadius: 12,
      padding: 20,
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    },
    row: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #f3f4f6",
      fontSize: 13,
    },
    label: { color: "#666", textTransform: "capitalize" },
    value: { fontWeight: 700, color: "#1e3a8a" },
  };

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={S.h1}>📊 Admin Analytics</h1>
          <p style={S.sub}>Platform insights and metrics</p>
        </div>
        <Link
          to="/admin"
          style={{
            background: "#1e3a8a",
            color: "white",
            padding: "10px 20px",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: 14,
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* STAT CARDS */}
      <div style={S.statGrid}>
        {[
          ["👥", "Total Users", totalUsers, "#1e3a8a"],
          ["✔️", "Verified", verifiedUsers, "#059669"],
          ["🚀", "Boosted", boostedUsers, "#f59e0b"],
          ["⭐", "Active Subs", activeSubs, "#0891b2"],
          ["🥇", "Gold", goldCount, "#f59e0b"],
          ["💎", "Platinum", platinumCount, "#db2777"],
          ["💰", "MRR", `₹${mrr}`, "#16a34a"],
          ["📈", "Total Revenue", `₹${totalRevenue}`, "#16a34a"],
        ].map(([ic, lb, v, c]) => (
          <div key={lb} style={{ ...S.stat, borderTop: `4px solid ${c}` }}>
            <div style={{ fontSize: 22 }}>{ic}</div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: "#666" }}>{lb}</div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW 1 */}
      <div style={S.chartGrid}>
        <div style={S.chartCard}>
          <Bar data={barData} options={barOptions} />
        </div>
        <div style={S.chartCard}>
          <Pie data={genderPieData} options={pieOptions} />
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div style={S.chartGrid}>
        <div style={S.chartCard}>
          <Pie data={subsPieData} options={pieOptions} />
        </div>
        <div style={S.chartCard}>
          <Bar data={ageBarData} options={ageOptions} />
        </div>
      </div>

      {/* TABLES ROW */}
      <div style={S.chartGrid}>
        <div style={S.listCard}>
          <h3 style={{ margin: "0 0 12px 0", color: "#1e3a8a", fontSize: 16 }}>
            🏷️ Top Communities
          </h3>
          {topCommunities.length === 0 ? (
            <p style={{ color: "#888", fontSize: 13 }}>No data</p>
          ) : (
            topCommunities.map(([name, count]) => (
              <div key={name} style={S.row}>
                <span style={S.label}>{name}</span>
                <span style={S.value}>{count} users</span>
              </div>
            ))
          )}
        </div>

        <div style={S.listCard}>
          <h3 style={{ margin: "0 0 12px 0", color: "#1e3a8a", fontSize: 16 }}>
            📍 Top Locations
          </h3>
          {topLocations.length === 0 ? (
            <p style={{ color: "#888", fontSize: 13 }}>No data</p>
          ) : (
            topLocations.map(([name, count]) => (
              <div key={name} style={S.row}>
                <span style={S.label}>{name}</span>
                <span style={S.value}>{count} users</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
