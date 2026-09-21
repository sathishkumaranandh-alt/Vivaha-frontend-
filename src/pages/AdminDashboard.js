import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subStats, setSubStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [reportFilter, setReportFilter] = useState("pending");
  const [subFilter, setSubFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [mainTab, setMainTab] = useState("users");

  useEffect(() => {
    async function checkAdminAndLoad() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Please log in first.");
          setLoading(false);
          return;
        }
        const { data: profile } = await supabase
          .from("users").select("role").eq("id", user.id).single();
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
    const [statsRes, usersRes, reportsRes, subsRes, subStatsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/profile/admin/stats`),
      fetch(`${BACKEND_URL}/profile/admin/users?limit=100`),
      fetch(`${BACKEND_URL}/reports/all`),
      fetch(`${BACKEND_URL}/subscriptions/admin/all`),
      fetch(`${BACKEND_URL}/subscriptions/admin/stats`),
    ]);

    if (statsRes.ok) setStats(await statsRes.json());
    if (usersRes.ok) setUsers((await usersRes.json()).users || []);
    if (reportsRes.ok) setReports((await reportsRes.json()).reports || []);
    if (subsRes.ok) setSubscriptions((await subsRes.json()).subscriptions || []);
    if (subStatsRes.ok) setSubStats(await subStatsRes.json());
  };

  // ============================================================
  // USER ACTIONS
  // ============================================================
  const handleVerify = async (userId, currentStatus) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_verified: !currentStatus }),
      });
      if (res.ok) await reloadData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (userId, userName) => {
    const reason = window.prompt(`Reason for suspending ${userName || "this user"}:`, "Violation of terms");
    if (reason === null) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) await reloadData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleUnsuspend = async (userId) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}/unsuspend`, { method: "PATCH" });
      if (res.ok) await reloadData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) await reloadData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleViewDetails = async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}/details`);
      if (res.ok) setSelectedUser((await res.json()).user);
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete ${userName || "this user"}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/profile/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) { alert("User deleted"); await reloadData(); }
    } catch (err) { console.error(err); }
  };

  // ============================================================
  // REPORT ACTIONS
  // ============================================================
  const handleResolveReport = async (reportId, action) => {
    setActionLoading(reportId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await fetch(`${BACKEND_URL}/reports/${reportId}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved_by: user?.id, action: action || "resolved" }),
      });
      if (res.ok) await reloadData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleDismissReport = async (reportId) => {
    if (!window.confirm("Dismiss this report? No action will be taken.")) return;
    setActionLoading(reportId);
    try {
      const res = await fetch(`${BACKEND_URL}/reports/${reportId}/dismiss`, { method: "PATCH" });
      if (res.ok) await reloadData();
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleSuspendReportedUser = async (report, reportId) => {
    const reason = window.prompt(`Reason for suspending ${report.reportedUser?.name || "this user"}:`, `Reported: ${report.reason}`);
    if (reason === null) return;
    setActionLoading(reportId);
    try {
      const res = await fetch(`${BACKEND_URL}/profile/admin/users/${report.reported_user_id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) await handleResolveReport(reportId, "user_suspended");
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  // ============================================================
  // SUBSCRIPTION ACTIONS
  // ============================================================
  const handleGrantPremium = async (userId, userName) => {
    const plan = window.prompt(`Grant which plan to ${userName || "user"}?\nType: gold or platinum`, "gold");
    if (!plan || !["gold", "platinum"].includes(plan)) return;
    const days = window.prompt("For how many days?", "30");
    if (!days) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`${BACKEND_URL}/subscriptions/admin/grant/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, days: parseInt(days) }),
      });
      if (res.ok) { alert("Gift subscription granted!"); await reloadData(); }
      else { alert("Failed to grant"); }
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleExtendSubscription = async (userId, userName) => {
    const days = window.prompt(`Extend ${userName || "subscription"} by how many days?`, "30");
    if (!days) return;

    setActionLoading(userId);
    try {
      const res = await fetch(`${BACKEND_URL}/subscriptions/admin/extend/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: parseInt(days) }),
      });
      if (res.ok) { alert("Subscription extended!"); await reloadData(); }
      else { alert("Failed to extend"); }
    } catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const handleDeleteSubscription = async (subId) => {
    if (!window.confirm("Delete this subscription record?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/subscriptions/admin/${subId}`, { method: "DELETE" });
      if (res.ok) { alert("Deleted"); await reloadData(); }
    } catch (err) { console.error(err); }
  };

  // ============================================================
  // FILTERING
  // ============================================================
  const filteredUsers = users
    .filter((u) => {
      if (userFilter === "verified") return u.is_verified;
      if (userFilter === "suspended") return u.is_suspended;
      if (userFilter === "admins") return u.role === "admin";
      return true;
    })
    .filter((u) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.location || "").toLowerCase().includes(q) ||
        (u.religion || "").toLowerCase().includes(q)
      );
    });

  const filteredReports = reports.filter((r) => {
    if (reportFilter === "all") return true;
    return r.status === reportFilter;
  });

  const filteredSubs = subscriptions.filter((s) => {
    if (subFilter === "all") return true;
    if (subFilter === "active") return s.status === "active";
    if (subFilter === "gold") return s.plan === "gold" && s.status === "active";
    if (subFilter === "platinum") return s.plan === "platinum" && s.status === "active";
    if (subFilter === "expired") return s.status === "expired" || s.status === "cancelled";
    return true;
  });

  const pendingReportsCount = reports.filter((r) => r.status === "pending").length;
  const activeSubsCount = subscriptions.filter((s) => s.status === "active" && s.plan !== "free").length;

  // ============================================================
  // RENDERING
  // ============================================================
  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>Loading admin dashboard... ⏳</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#b91c1c", fontSize: "18px", marginBottom: "16px" }}>⚠️ {error}</p>
        <Link to="/" style={{ display: "inline-block", padding: "10px 24px", background: "#1e3a8a", color: "white", textDecoration: "none", borderRadius: "8px", fontWeight: "bold" }}>Go Home</Link>
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
        <Link to="/admin-analytics" style={analyticsButtonStyle}>📊 View Analytics</Link>
      </div>
<Link to="/admin-settings" style={{background:"#7c3aed",color:"white",padding:"10px 14px",borderRadius:"8px",textDecoration:"none",fontWeight:"bold",fontSize:"13px"}}>⚙️</Link>

      {/* STAT CARDS */}
      {stats && (
        <div style={statsGridStyle}>
          <StatCard icon="👥" label="Users" value={stats.totalUsers} color="#1e3a8a" />
          <StatCard icon="👨" label="Male" value={stats.maleUsers} color="#2563eb" />
          <StatCard icon="👩" label="Female" value={stats.femaleUsers} color="#db2777" />
          <StatCard icon="💬" label="Messages" value={stats.totalMessages} color="#16a34a" />
          <StatCard icon="✔️" label="Verified" value={stats.verifiedUsers} color="#059669" />
          <StatCard icon="🚫" label="Suspended" value={stats.suspendedUsers} color="#dc2626" />
          <StatCard icon="⭐" label="Premium" value={activeSubsCount} color="#f59e0b" />
          <StatCard icon="💰" label="MRR" value={`₹${subStats?.mrr || 0}`} color="#16a34a" />
        </div>
      )}

      {/* MAIN TABS */}
      <div style={mainTabsStyle}>
        <button onClick={() => setMainTab("users")} style={{ ...mainTabButtonStyle, background: mainTab === "users" ? "#1e3a8a" : "#f3f4f6", color: mainTab === "users" ? "white" : "#374151" }}>
          👥 Users ({users.length})
        </button>
        <button onClick={() => setMainTab("reports")} style={{ ...mainTabButtonStyle, background: mainTab === "reports" ? "#dc2626" : "#f3f4f6", color: mainTab === "reports" ? "white" : "#374151" }}>
          🚨 Reports ({pendingReportsCount})
        </button>
        <button onClick={() => setMainTab("subscriptions")} style={{ ...mainTabButtonStyle, background: mainTab === "subscriptions" ? "#f59e0b" : "#f3f4f6", color: mainTab === "subscriptions" ? "white" : "#374151" }}>
          ⭐ Subscriptions ({activeSubsCount})
        </button>
      </div>

      {/* ==================== USERS TAB ==================== */}
      {mainTab === "users" && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>All Users ({filteredUsers.length})</h2>
            <input type="text" placeholder="🔍 Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={searchInputStyle} />
          </div>
          <div style={tabsStyle}>
            {[
              { key: "all", label: `All (${users.length})` },
              { key: "verified", label: `✔️ Verified (${users.filter((u) => u.is_verified).length})` },
              { key: "suspended", label: `🚫 Suspended (${users.filter((u) => u.is_suspended).length})` },
              { key: "admins", label: `👑 Admins (${users.filter((u) => u.role === "admin").length})` },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setUserFilter(tab.key)} style={{ ...tabButtonStyle, background: userFilter === tab.key ? "#1e3a8a" : "#f3f4f6", color: userFilter === tab.key ? "white" : "#374151" }}>{tab.label}</button>
            ))}
          </div>
          {filteredUsers.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", padding: "40px" }}>No users found.</p>
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
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={{ ...tableRowStyle, background: u.is_suspended ? "#fef2f2" : "transparent", opacity: actionLoading === u.id ? 0.5 : 1 }}>
                      <td style={tdStyle}>
                        <div style={avatarSmallStyle}>
                          {u.photo_url ? <img src={u.photo_url} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          {u.name || "—"}
                          {u.is_verified && <span title="Verified">✔️</span>}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontSize: "12px", color: "#666" }}>{u.email || "—"}</td>
                      <td style={tdStyle}>{u.age || "—"}</td>
                      <td style={tdStyle}>
                        {u.gender ? (
                          <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "12px", background: u.gender === "male" ? "#dbeafe" : "#fce7f3", color: u.gender === "male" ? "#1e40af" : "#9f1239" }}>{u.gender}</span>
                        ) : "—"}
                      </td>
                      <td style={tdStyle}>
                        {u.is_suspended ? <span style={suspendedBadgeStyle}>🚫 Suspended</span> : <span style={activeBadgeStyle}>● Active</span>}
                      </td>
                      <td style={tdStyle}>
                        <select value={u.role || "user"} onChange={(e) => handleRoleChange(u.id, e.target.value)} style={roleSelectStyle} disabled={actionLoading === u.id}>
                          <option value="user">👤 User</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          <button onClick={() => handleViewDetails(u.id)} style={viewBtnStyle} title="View">👁️</button>
                          <button onClick={() => handleVerify(u.id, u.is_verified)} style={u.is_verified ? unverifyBtnStyle : verifyBtnStyle} title="Verify">{u.is_verified ? "✖️" : "✔️"}</button>
                          {u.is_suspended ? (
                            <button onClick={() => handleUnsuspend(u.id)} style={unsuspendBtnStyle} title="Unsuspend">✅</button>
                          ) : (
                            <button onClick={() => handleSuspend(u.id, u.name)} style={suspendBtnStyle} title="Suspend">🚫</button>
                          )}
                          {u.role !== "admin" && (
                            <button onClick={() => handleDeleteUser(u.id, u.name)} style={deleteBtnStyle} title="Delete">🗑️</button>
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
      )}

      {/* ==================== REPORTS TAB ==================== */}
      {mainTab === "reports" && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>Reports ({filteredReports.length})</h2>
          </div>
          <div style={tabsStyle}>
            {[
              { key: "pending", label: `🚨 Pending (${reports.filter((r) => r.status === "pending").length})` },
              { key: "resolved", label: `✅ Resolved (${reports.filter((r) => r.status === "resolved").length})` },
              { key: "dismissed", label: `✖️ Dismissed (${reports.filter((r) => r.status === "dismissed").length})` },
              { key: "all", label: `📋 All (${reports.length})` },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setReportFilter(tab.key)} style={{ ...tabButtonStyle, background: reportFilter === tab.key ? "#dc2626" : "#f3f4f6", color: reportFilter === tab.key ? "white" : "#374151" }}>{tab.label}</button>
            ))}
          </div>
          {filteredReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "60px", marginBottom: "12px" }}>🎉</div>
              <p style={{ color: "#666", fontSize: "17px" }}>No {reportFilter} reports.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredReports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  loading={actionLoading === r.id}
                  onResolve={() => handleResolveReport(r.id, "resolved")}
                  onDismiss={() => handleDismissReport(r.id)}
                  onSuspend={() => handleSuspendReportedUser(r, r.id)}
                  onViewReportedUser={() => handleViewDetails(r.reported_user_id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== SUBSCRIPTIONS TAB ==================== */}
      {mainTab === "subscriptions" && (
        <div style={sectionStyle}>
          {/* SUBSCRIPTION STATS */}
          {subStats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <div style={{ background: "#dcfce7", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#166534" }}>₹{subStats.totalRevenue}</div>
                <div style={{ fontSize: "12px", color: "#166534" }}>Total Revenue</div>
              </div>
              <div style={{ background: "#fef3c7", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#92400e" }}>₹{subStats.mrr}</div>
                <div style={{ fontSize: "12px", color: "#92400e" }}>Current MRR</div>
              </div>
              <div style={{ background: "#dbeafe", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1e40af" }}>{subStats.activeSubscriptions}</div>
                <div style={{ fontSize: "12px", color: "#1e40af" }}>Active Subs</div>
              </div>
              <div style={{ background: "#fef9c3", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#854d0e" }}>{subStats.goldCount}</div>
                <div style={{ fontSize: "12px", color: "#854d0e" }}>Gold</div>
              </div>
              <div style={{ background: "#fce7f3", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: "#9f1239" }}>{subStats.platinumCount}</div>
                <div style={{ fontSize: "12px", color: "#9f1239" }}>Platinum</div>
              </div>
            </div>
          )}

          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>All Subscriptions ({filteredSubs.length})</h2>
          </div>

          <div style={tabsStyle}>
            {[
              { key: "all", label: `All (${subscriptions.length})` },
              { key: "active", label: `✓ Active (${subscriptions.filter((s) => s.status === "active").length})` },
              { key: "gold", label: `🥇 Gold (${subscriptions.filter((s) => s.plan === "gold" && s.status === "active").length})` },
              { key: "platinum", label: `💎 Platinum (${subscriptions.filter((s) => s.plan === "platinum" && s.status === "active").length})` },
              { key: "expired", label: `⏰ Expired (${subscriptions.filter((s) => s.status !== "active").length})` },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setSubFilter(tab.key)} style={{ ...tabButtonStyle, background: subFilter === tab.key ? "#f59e0b" : "#f3f4f6", color: subFilter === tab.key ? "white" : "#374151" }}>{tab.label}</button>
            ))}
          </div>

          {filteredSubs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "60px", marginBottom: "12px" }}>💳</div>
              <p style={{ color: "#666", fontSize: "17px" }}>No subscriptions found.</p>
              <p style={{ color: "#999", fontSize: "14px" }}>Users haven't subscribed yet.</p>
            </div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Plan</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Started</th>
                    <th style={thStyle}>Expires</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((s) => (
                    <tr key={s.id} style={{ ...tableRowStyle, opacity: actionLoading === s.user_id ? 0.5 : 1 }}>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={avatarSmallStyle}>
                            {s.user?.photo_url ? <img src={s.user.photo_url} alt={s.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#1e3a8a", fontSize: "13px" }}>{s.user?.name || "Unknown"}</div>
                            <div style={{ fontSize: "11px", color: "#888" }}>{s.user?.email || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: s.plan === "platinum" ? "#fce7f3" : s.plan === "gold" ? "#fef3c7" : "#e5e7eb",
                          color: s.plan === "platinum" ? "#9f1239" : s.plan === "gold" ? "#92400e" : "#4b5563",
                        }}>
                          {s.plan === "platinum" ? "💎" : s.plan === "gold" ? "🥇" : "👤"} {s.plan}
                        </span>
                      </td>
                      <td style={tdStyle}>₹{s.amount || 0}</td>
                      <td style={tdStyle}>
                        {s.status === "active" ? <span style={activeBadgeStyle}>● Active</span> : <span style={{ ...suspendedBadgeStyle, background: "#e5e7eb", color: "#4b5563" }}>{s.status}</span>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: "12px" }}>{s.started_at ? new Date(s.started_at).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ ...tdStyle, fontSize: "12px" }}>{s.expires_at ? new Date(s.expires_at).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button onClick={() => handleGrantPremium(s.user_id, s.user?.name)} style={viewBtnStyle} title="Grant Premium">🎁</button>
                          {s.status === "active" && s.plan !== "free" && (
                            <button onClick={() => handleExtendSubscription(s.user_id, s.user?.name)} style={verifyBtnStyle} title="Extend">➕</button>
                          )}
                          <button onClick={() => handleDeleteSubscription(s.id)} style={deleteBtnStyle} title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedUser && (
        <div style={modalOverlayStyle} onClick={() => setSelectedUser(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} style={modalCloseStyle}>✕</button>
            <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>{selectedUser.name || "Anonymous"}'s Details</h2>
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
              <DetailRow label="Verified" value={selectedUser.is_verified ? "✔️ Yes" : "✖️ No"} />
              <DetailRow label="Suspended" value={selectedUser.is_suspended ? "🚫 Yes" : "✅ No"} />
              {selectedUser.suspend_reason && <DetailRow label="Suspend Reason" value={selectedUser.suspend_reason} />}
              <DetailRow label="Role" value={selectedUser.role || "user"} />
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
      <div style={{ fontSize: "24px", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "20px", fontWeight: "bold", color, marginBottom: "2px" }}>{value}</div>
      <div style={{ fontSize: "11px", color: "#666" }}>{label}</div>
    </div>
  );
}

function ReportCard({ report, loading, onResolve, onDismiss, onSuspend, onViewReportedUser }) {
  const statusColors = {
    pending: { bg: "#fef3c7", color: "#92400e", text: "🚨 Pending" },
    resolved: { bg: "#dcfce7", color: "#166534", text: "✅ Resolved" },
    dismissed: { bg: "#e5e7eb", color: "#4b5563", text: "✖️ Dismissed" },
  };
  const statusStyle = statusColors[report.status] || statusColors.pending;

  return (
    <div style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px", opacity: loading ? 0.6 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingBottom: "10px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ background: statusStyle.bg, color: statusStyle.color, padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>{statusStyle.text}</span>
          <span style={{ fontSize: "12px", color: "#666" }}>{new Date(report.created_at).toLocaleString("en-IN")}</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "12px" }}>
        <div style={{ background: "white", padding: "10px", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#888", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>👤 Reported User</p>
          <p style={{ margin: 0, fontSize: "14px", color: "#1e3a8a", fontWeight: "600" }}>{report.reportedUser?.name || "Unknown"}</p>
        </div>
        <div style={{ background: "white", padding: "10px", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#888", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>📢 Reported By</p>
          <p style={{ margin: 0, fontSize: "14px", color: "#1e3a8a", fontWeight: "600" }}>{report.reporter?.name || "Unknown"}</p>
        </div>
        <div style={{ background: "white", padding: "10px", borderRadius: "8px" }}>
          <p style={{ margin: 0, fontSize: "11px", color: "#888", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>⚠️ Reason</p>
          <p style={{ margin: 0, fontSize: "14px", color: "#1e3a8a", fontWeight: "600", textTransform: "capitalize" }}>{report.reason?.replace(/_/g, " ") || "—"}</p>
        </div>
        {report.details && (
          <div style={{ background: "white", padding: "10px", borderRadius: "8px", gridColumn: "1 / -1" }}>
            <p style={{ margin: 0, fontSize: "11px", color: "#888", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>📝 Details</p>
            <p style={{ margin: 0, fontSize: "13px", color: "#444", fontStyle: "italic" }}>"{report.details}"</p>
          </div>
        )}
      </div>
      {report.status === "pending" && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
          <button onClick={onViewReportedUser} style={viewBtnStyle}>👁️ View User</button>
          <button onClick={onSuspend} style={suspendBtnStyle}>🚫 Suspend</button>
          <button onClick={onResolve} style={verifyBtnStyle}>✅ Resolve</button>
          <button onClick={onDismiss} style={{ background: "#e5e7eb", color: "#4b5563", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>✖️ Dismiss</button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "6px 0" }}>
      <span style={{ color: "#666", fontSize: "13px" }}>{label}:</span>
      <span style={{ fontWeight: "600", color: "#1e3a8a", fontSize: "13px" }}>{value || "—"}</span>
    </div>
  );
}

// STYLES
const pageStyle = { maxWidth: "1400px", margin: "0 auto", padding: "24px 16px" };
const headerRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "24px" };
const titleStyle = { color: "#1e3a8a", fontSize: "28px", margin: "0 0 4px 0" };
const subtitleStyle = { color: "#666", fontSize: "14px", margin: 0 };
const analyticsButtonStyle = { background: "#1e3a8a", color: "white", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" };
const statsGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginBottom: "24px" };
const statCardStyle = { background: "white", borderRadius: "12px", padding: "14px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" };
const mainTabsStyle = { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" };
const mainTabButtonStyle = { border: "none", padding: "12px 20px", fontSize: "14px", fontWeight: "700", cursor: "pointer", borderRadius: "8px", transition: "all 0.2s" };
const sectionStyle = { background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" };
const sectionHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" };
const sectionTitleStyle = { margin: 0, color: "#1e3a8a", fontSize: "20px" };
const searchInputStyle = { padding: "10px 16px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", fontFamily: "inherit", minWidth: "250px", flex: 1, maxWidth: "400px" };
const tabsStyle = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" };
const tabButtonStyle = { border: "none", padding: "8px 16px", borderRadius: "20px", fontSize: "13px", fontWeight: "600", cursor: "pointer" };
const tableWrapperStyle = { overflowX: "auto", margin: "0 -20px", padding: "0 20px" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "14px" };
const tableHeaderRowStyle = { background: "#f9fafb", borderBottom: "2px solid #e5e7eb" };
const thStyle = { padding: "12px 10px", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#666", textTransform: "uppercase", whiteSpace: "nowrap" };
const tableRowStyle = { borderBottom: "1px solid #f3f4f6" };
const tdStyle = { padding: "12px 10px", whiteSpace: "nowrap" };
const avatarSmallStyle = { width: "36px", height: "36px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", overflow: "hidden", flexShrink: 0 };
const suspendedBadgeStyle = { background: "#fee2e2", color: "#991b1b", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" };
const activeBadgeStyle = { background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600" };
const roleSelectStyle = { padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "12px", background: "white", cursor: "pointer", fontFamily: "inherit" };
const viewBtnStyle = { background: "#eff6ff", color: "#1e40af", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const verifyBtnStyle = { background: "#dcfce7", color: "#166534", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const unverifyBtnStyle = { background: "#fef3c7", color: "#92400e", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const suspendBtnStyle = { background: "#fee2e2", color: "#991b1b", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const unsuspendBtnStyle = { background: "#dcfce7", color: "#166534", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const deleteBtnStyle = { background: "#fee2e2", color: "#b91c1c", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 1000 };
const modalStyle = { background: "white", borderRadius: "16px", padding: "28px", maxWidth: "500px", width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative" };
const modalCloseStyle = { position: "absolute", top: "12px", right: "12px", background: "#f3f4f6", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", fontWeight: "bold", color: "#666" };

export default AdminDashboard;
