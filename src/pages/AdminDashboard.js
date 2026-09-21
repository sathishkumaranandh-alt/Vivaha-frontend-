import React, { useState, useEffect } from "react";
import { Link} from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ============================================================
  // CHECK ADMIN ACCESS + LOAD DATA
  // ============================================================
  useEffect(() => {
    async function checkAdminAndLoad() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("Please log in first.");
          setLoading(false);
          return;
        }

        // Check if user is admin
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || profile.role !== "admin") {
          setError("Access denied. Admin only.");
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // Load stats and users
        const [statsRes, usersRes] = await Promise.all([
          fetch(`${BACKEND_URL}/profile/admin/stats`),
          fetch(`${BACKEND_URL}/profile/admin/users?limit=100`),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
        }
      } catch (err) {
        console.error("Admin load error:", err);
        setError("Could not load admin data.");
      } finally {
        setLoading(false);
      }
    }
    checkAdminAndLoad();
  }, []);

  // ============================================================
  // DELETE USER
  // ============================================================
  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${userName || "this user"}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        alert("User deleted successfully");
      } else {
        alert("Failed to delete user");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error. Please try again.");
    }
  };

  // ============================================================
  // FILTER USERS BY SEARCH
  // ============================================================
  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.location || "").toLowerCase().includes(q) ||
      (u.religion || "").toLowerCase().includes(q)
    );
  });

  // ============================================================
  // RENDERING
  // ============================================================

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>
          Loading admin dashboard... ⏳
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#b91c1c", fontSize: "18px", marginBottom: "16px" }}>
          ⚠️ {error}
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "#1e3a8a",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          Go Home
        </Link>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div style={pageStyle}>
      {/* ===== HEADER ===== */}
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>👑 Admin Dashboard</h1>
          <p style={subtitleStyle}>Manage your Vivaha platform</p>
        </div>
        <Link to="/admin-analytics" style={analyticsButtonStyle}>
          📊 View Analytics
        </Link>
      </div>

      {/* ===== STATS CARDS ===== */}
      {stats && (
        <div style={statsGridStyle}>
          <StatCard
            icon="👥"
            label="Total Users"
            value={stats.totalUsers}
            color="#1e3a8a"
          />
          <StatCard
            icon="👨"
            label="Male Users"
            value={stats.maleUsers}
            color="#2563eb"
          />
          <StatCard
            icon="👩"
            label="Female Users"
            value={stats.femaleUsers}
            color="#db2777"
          />
          <StatCard
            icon="💬"
            label="Total Messages"
            value={stats.totalMessages}
            color="#16a34a"
          />
          <StatCard
            icon="🆕"
            label="New (7 days)"
            value={stats.recentSignups}
            color="#ea580c"
          />
        </div>
      )}

      {/* ===== USERS TABLE ===== */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>
            All Users ({filteredUsers.length})
          </h2>
          <input
            type="text"
            placeholder="🔍 Search by name, email, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        {filteredUsers.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888", padding: "40px" }}>
            No users found.
          </p>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>Photo</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Age</th>
                  <th style={thStyle}>Gender</th>
                  <th style={thStyle}>Location</th>
                  <th style={thStyle}>Religion</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={tableRowStyle}>
                    <td style={tdStyle}>
                      <div style={avatarSmallStyle}>
                        {u.photo_url ? (
                          <img
                            src={u.photo_url}
                            alt={u.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          "👤"
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>{u.name || "—"}</td>
                    <td style={{ ...tdStyle, fontSize: "12px", color: "#666" }}>
                      {u.email || "—"}
                    </td>
                    <td style={tdStyle}>{u.age || "—"}</td>
                    <td style={tdStyle}>
                      {u.gender ? (
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            background:
                              u.gender === "male" ? "#dbeafe" : "#fce7f3",
                            color: u.gender === "male" ? "#1e40af" : "#9f1239",
                          }}
                        >
                          {u.gender}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={tdStyle}>{u.location || "—"}</td>
                    <td style={tdStyle}>{u.religion || "—"}</td>
                    <td style={tdStyle}>
                      {u.role === "admin" ? (
                        <span style={adminBadgeStyle}>👑 Admin</span>
                      ) : (
                        <span style={userBadgeStyle}>User</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Link
                          to={`/profile/${u.id}`}
                          style={viewBtnStyle}
                          title="View"
                        >
                          👁️
                        </Link>
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            style={deleteBtnStyle}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...statCardStyle, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: "32px", marginBottom: "8px" }}>{icon}</div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          color: color,
          marginBottom: "4px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "13px", color: "#666" }}>{label}</div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const pageStyle = {
  maxWidth: "1300px",
  margin: "0 auto",
  padding: "24px 16px",
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "24px",
};

const titleStyle = {
  color: "#1e3a8a",
  fontSize: "28px",
  margin: "0 0 4px 0",
};

const subtitleStyle = {
  color: "#666",
  fontSize: "14px",
  margin: 0,
};

const analyticsButtonStyle = {
  background: "#1e3a8a",
  color: "white",
  padding: "10px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "16px",
  marginBottom: "32px",
};

const statCardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};

const sectionStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "16px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#1e3a8a",
  fontSize: "20px",
};

const searchInputStyle = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  fontFamily: "inherit",
  minWidth: "250px",
  flex: 1,
  maxWidth: "400px",
};

const tableWrapperStyle = {
  overflowX: "auto",
  margin: "0 -20px",
  padding: "0 20px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const tableHeaderRowStyle = {
  background: "#f9fafb",
  borderBottom: "2px solid #e5e7eb",
};

const thStyle = {
  padding: "12px 10px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: "700",
  color: "#666",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const tableRowStyle = {
  borderBottom: "1px solid #f3f4f6",
};

const tdStyle = {
  padding: "12px 10px",
  whiteSpace: "nowrap",
};

const avatarSmallStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "#f3f4f6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  overflow: "hidden",
};

const adminBadgeStyle = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "3px 10px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: "600",
};

const userBadgeStyle = {
  background: "#e5e7eb",
  color: "#4b5563",
  padding: "3px 10px",
  borderRadius: "12px",
  fontSize: "12px",
};

const viewBtnStyle = {
  background: "#eff6ff",
  color: "#1e40af",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  textDecoration: "none",
  fontSize: "14px",
};

const deleteBtnStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
};

export default AdminDashboard;