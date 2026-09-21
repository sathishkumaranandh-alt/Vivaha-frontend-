import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  const [filter, setFilter] = useState("all"); // all | verified | suspended | admins
  const [selectedUser, setSelectedUser] = useState(null); // for details modal
  const [actionLoading, setActionLoading] = useState(null); // userId being processed

  // ============================================================
  // LOAD DATA
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
        await reloadData();
      } catch (err) {
        console.error("Admin load error:", err);
        setError("Could not load admin data.");
      } finally {
        setLoading(false);
      }
    }
    checkAdminAndLoad();
  }, []);

  const reloadData = async () => {
    const [statsRes, usersRes] = await Promise.all([
      fetch(`${BACKEND_URL}/profile/admin/stats`),
      fetch(`${BACKEND_URL}/profile/admin/users?limit=100`),
    ]);

    if (statsRes.ok) setStats(await statsRes.json());

    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(data.users || []);
    }
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  const handleVerify = async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      const res = await fetch(
        `${BACKEND_URL}/profile/admin/users/${userId}/verify`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_verified: !currentStatus }),
        }
      );
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, is_verified: !currentStatus } : u
          )
        );
        await reloadData();
      }
    } catch (err) {
      console.error("Verify error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId, userName) => {
    const reason = window.prompt(
      `Reason for suspending ${userName || "this user"}:`,
      "Violation of terms"
    );
    if (reason === null) return;

    setActionLoading(userId);
    try {
      const res = await fetch(
        `${BACKEND_URL}/profile/admin/users/${userId}/suspend`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      );
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, is_suspended: true, suspend_reason: reason }
              : u
          )
        );
        await reloadData();
      }
    } catch (err) {
      console.error("Suspend error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspend = async (userId) => {
    setActionLoading(userId);
    try {
      const res = await fetch(
        `${BACKEND_URL}/profile/admin/users/${userId}/unsuspend`,
        { method: "PATCH" }
      );
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, is_suspended: false, suspend_reason: null }
              : u
          )
        );
        await reloadData();
      }
    } catch (err) {
      console.error("Unsuspend error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (
      !window.confirm(
        `Change this user's role to "${newRole}"?`
      )
    )
      return;

    setActionLoading(userId);
    try {
      const res = await fetch(
        `${BACKEND_URL}/profile/admin/users/${userId}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        await reloadData();
      }
    } catch (err) {
      console.error("Role change error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/profile/admin/users/${userId}/details`
      );
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.user);
      }
    } catch (err) {
      console.error("Details error:", err);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${userName || "this user"}? This cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(
        `${BACKEND_URL}/profile/admin/users/${userId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        alert("User deleted successfully");
        await reloadData();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // ============================================================
  // FILTERING
  // ============================================================
  const filteredUsers = users
    .filter((u) => {
      // Apply tab filter
      if (filter === "verified") return u.is_verified;
      if (filter === "suspended") return u.is_suspended;
      if (filter === "admins") return u.role === "admin";
      return true;
    })
    .filter((u) => {
      // Apply search
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
      {/* HEADER */}
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>👑 Admin Dashboard</h1>
          <p style={subtitleStyle}>Manage your Vivaha platform</p>
        </div>
        <Link to="/admin-analytics" style={analyticsButtonStyle}>
          📊 View Analytics
        </Link>
      </div>

      {/* STAT CARDS */}
      {stats && (
        <div style={statsGridStyle}>
          <StatCard icon="👥" label="Total Users" value={stats.totalUsers} color="#1e3a8a" />
          <StatCard icon="👨" label="Male" value={stats.maleUsers} color="#2563eb" />
          <StatCard icon="👩" label="Female" value={stats.femaleUsers} color="#db2777" />
          <StatCard icon="💬" label="Messages" value={stats.totalMessages} color="#16a34a" />
          <StatCard icon="🆕" label="New (7d)" value={stats.recentSignups} color="#ea580c" />
          <StatCard icon="✔️" label="Verified" value={stats.verifiedUsers} color="#059669" />
          <StatCard icon="🚫" label="Suspended" value={stats.suspendedUsers} color="#dc2626" />
        </div>
      )}

      {/* USERS SECTION */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <h2 style={sectionTitleStyle}>All Users ({filteredUsers.length})</h2>
          <input
            type="text"
            placeholder="🔍 Search by name, email, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
        </div>

        {/* FILTER TABS */}
        <div style={tabsStyle}>
          {[
            { key: "all", label: `All (${users.length})` },
            { key: "verified", label: `✔️ Verified (${users.filter((u) => u.is_verified).length})` },
            { key: "suspended", label: `🚫 Suspended (${users.filter((u) => u.is_suspended).length})` },
            { key: "admins", label: `👑 Admins (${users.filter((u) => u.role === "admin").length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                ...tabButtonStyle,
                background: filter === tab.key ? "#1e3a8a" : "#f3f4f6",
                color: filter === tab.key ? "white" : "#374151",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* USERS TABLE */}
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
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    style={{
                      ...tableRowStyle,
                      background: u.is_suspended ? "#fef2f2" : "transparent",
                      opacity: actionLoading === u.id ? 0.5 : 1,
                    }}
                  >
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
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {u.name || "—"}
                        {u.is_verified && (
                          <span style={verifiedBadgeStyle} title="Verified">✔️</span>
                        )}
                      </div>
                    </td>
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
                            background: u.gender === "male" ? "#dbeafe" : "#fce7f3",
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
                    <td style={tdStyle}>
                      {u.is_suspended ? (
                        <span style={suspendedBadgeStyle}>🚫 Suspended</span>
                      ) : (
                        <span style={activeBadgeStyle}>● Active</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <select
                        value={u.role || "user"}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={roleSelectStyle}
                        disabled={actionLoading === u.id}
                      >
                        <option value="user">👤 User</option>
                        <option value="admin">👑 Admin</option>
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {/* View */}
                        <button
                          onClick={() => handleViewDetails(u.id)}
                          style={viewBtnStyle}
                          title="View Details"
                        >
                          👁️
                        </button>

                        {/* Verify */}
                        <button
                          onClick={() => handleVerify(u.id, u.is_verified)}
                          style={
                            u.is_verified
                              ? unverifyBtnStyle
                              : verifyBtnStyle
                          }
                          title={u.is_verified ? "Remove verification" : "Verify user"}
                          disabled={actionLoading === u.id}
                        >
                          {u.is_verified ? "✖️" : "✔️"}
                        </button>

                        {/* Suspend / Unsuspend */}
                        {u.is_suspended ? (
                          <button
                            onClick={() => handleUnsuspend(u.id)}
                            style={unsuspendBtnStyle}
                            title="Unsuspend user"
                            disabled={actionLoading === u.id}
                          >
                            ✅
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSuspend(u.id, u.name)}
                            style={suspendBtnStyle}
                            title="Suspend user"
                            disabled={actionLoading === u.id}
                          >
                            🚫
                          </button>
                        )}

                        {/* Delete */}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            style={deleteBtnStyle}
                            title="Delete user"
                            disabled={actionLoading === u.id}
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

      {/* DETAILS MODAL */}
      {selectedUser && (
        <div style={modalOverlayStyle} onClick={() => setSelectedUser(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedUser(null)}
              style={modalCloseStyle}
            >
              ✕
            </button>
            <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>
              {selectedUser.name || "Anonymous"}'s Details
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <DetailRow label="Email" value={selectedUser.email} />
              <DetailRow label="Age" value={selectedUser.age} />
              <DetailRow label="Gender" value={selectedUser.gender} />
              <DetailRow label="Religion" value={selectedUser.religion} />
              <DetailRow label="Caste" value={selectedUser.caste} />
              <DetailRow label="Location" value={selectedUser.location} />
              <DetailRow label="Education" value={selectedUser.education} />
              <DetailRow label="Occupation" value={selectedUser.occupation} />
              <DetailRow label="Income" value={selectedUser.income} />
              <DetailRow label="Marital Status" value={selectedUser.marital_status} />
              <DetailRow label="Mother Tongue" value={selectedUser.mother_tongue} />
              <DetailRow label="Diet" value={selectedUser.diet} />
              <DetailRow
                label="Verified"
                value={selectedUser.is_verified ? "✔️ Yes" : "✖️ No"}
              />
              <DetailRow
                label="Suspended"
                value={selectedUser.is_suspended ? "🚫 Yes" : "✅ No"}
              />
              {selectedUser.suspend_reason && (
                <DetailRow label="Suspend Reason" value={selectedUser.suspend_reason} />
              )}
              <DetailRow label="Role" value={selectedUser.role || "user"} />
              {selectedUser.bio && (
                <div>
                  <p style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                    Bio:
                  </p>
                  <p style={{ fontStyle: "italic", margin: 0, color: "#444" }}>
                    "{selectedUser.bio}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...statCardStyle, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: "28px", marginBottom: "6px" }}>{icon}</div>
      <div
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          color: color,
          marginBottom: "2px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "12px", color: "#666" }}>{label}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        borderBottom: "1px solid #f3f4f6",
        padding: "6px 0",
      }}
    >
      <span style={{ color: "#666", fontSize: "13px" }}>{label}:</span>
      <span style={{ fontWeight: "600", color: "#1e3a8a", fontSize: "13px" }}>
        {value || "—"}
      </span>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================
const pageStyle = { maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" };
const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "24px",
};
const titleStyle = { color: "#1e3a8a", fontSize: "28px", margin: "0 0 4px 0" };
const subtitleStyle = { color: "#666", fontSize: "14px", margin: 0 };
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
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "12px",
  marginBottom: "24px",
};
const statCardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "16px",
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
const sectionTitleStyle = { margin: 0, color: "#1e3a8a", fontSize: "20px" };
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
const tabsStyle = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "16px",
};
const tabButtonStyle = {
  border: "none",
  padding: "8px 16px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s",
};
const tableWrapperStyle = { overflowX: "auto", margin: "0 -20px", padding: "0 20px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "14px" };
const tableHeaderRowStyle = { background: "#f9fafb", borderBottom: "2px solid #e5e7eb" };
const thStyle = {
  padding: "12px 10px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: "700",
  color: "#666",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};
const tableRowStyle = { borderBottom: "1px solid #f3f4f6", transition: "background 0.2s" };
const tdStyle = { padding: "12px 10px", whiteSpace: "nowrap" };
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
const verifiedBadgeStyle = { fontSize: "14px" };
const suspendedBadgeStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "3px 8px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "600",
};
const activeBadgeStyle = {
  background: "#dcfce7",
  color: "#166534",
  padding: "3px 8px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: "600",
};
const roleSelectStyle = {
  padding: "4px 8px",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "12px",
  background: "white",
  cursor: "pointer",
  fontFamily: "inherit",
};
const viewBtnStyle = {
  background: "#eff6ff",
  color: "#1e40af",
  border: "none",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};
const verifyBtnStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "none",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};
const unverifyBtnStyle = {
  background: "#fef3c7",
  color: "#92400e",
  border: "none",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};
const suspendBtnStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "none",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};
const unsuspendBtnStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "none",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};
const deleteBtnStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};
const modalStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "28px",
  maxWidth: "500px",
  width: "100%",
  maxHeight: "85vh",
  overflowY: "auto",
  position: "relative",
};
const modalCloseStyle = {
  position: "absolute",
  top: "12px",
  right: "12px",
  background: "#f3f4f6",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold",
  color: "#666",
};

export default AdminDashboard;
