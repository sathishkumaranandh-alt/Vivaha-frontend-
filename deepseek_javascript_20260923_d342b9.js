import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";

const API = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [subs, setSubs] = useState([]);
  const [subStats, setSubStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("users");
  const [userFilter, setUserFilter] = useState("all");
  const [reportFilter, setReportFilter] = useState("pending");
  const [subFilter, setSubFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError("Please log in first."); setLoading(false); return; }
        const { data: p } = await supabase.from("users").select("role").eq("id", user.id).single();
        if (!p || p.role !== "admin") { setError("Access denied. Admin only."); setLoading(false); return; }
        setIsAdmin(true);
        await reload();
      } catch { setError("Could not load admin data."); }
      finally { setLoading(false); }
    })();
  }, []);

  const reload = async () => {
    const r = await Promise.all([
      fetch(`${API}/profile/admin/stats`).then(x => x.ok ? x.json() : null),
      fetch(`${API}/profile/admin/users?limit=100`).then(x => x.ok ? x.json() : null),
      fetch(`${API}/reports/all`).then(x => x.ok ? x.json() : null),
      fetch(`${API}/subscriptions/admin/all`).then(x => x.ok ? x.json() : null),
      fetch(`${API}/subscriptions/admin/stats`).then(x => x.ok ? x.json() : null),
    ]);
    if (r[0]) setStats(r[0]);
    if (r[1]) setUsers(r[1].users || []);
    if (r[2]) setReports(r[2].reports || []);
    if (r[3]) setSubs(r[3].subscriptions || []);
    if (r[4]) setSubStats(r[4]);
  };

  const patch = async (url, body, id) => {
    setBusy(id);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) await reload();
    } catch (e) { console.error(e); }
    finally { setBusy(null); }
  };

  const verify = (id, cur) => patch(`${API}/profile/admin/users/${id}/verify`, { is_verified: !cur }, id);
  const suspend = async (id, name) => {
    const reason = window.prompt(`Suspend ${name || "user"}? Reason:`, "Violation");
    if (reason === null) return;
    patch(`${API}/profile/admin/users/${id}/suspend`, { reason }, id);
  };
  const unsuspend = (id) => patch(`${API}/profile/admin/users/${id}/unsuspend`, null, id);
  const changeRole = (id, role) => {
    if (!window.confirm(`Change role to "${role}"?`)) return;
    patch(`${API}/profile/admin/users/${id}/role`, { role }, id);
  };
  const viewUser = async (id) => {
    const r = await fetch(`${API}/profile/admin/users/${id}/details`);
    if (r.ok) setSelectedUser((await r.json()).user);
  };
  const delUser = async (id, name) => {
    if (!window.confirm(`Delete ${name || "user"}?`)) return;
    await fetch(`${API}/profile/admin/users/${id}`, { method: "DELETE" });
    await reload();
  };
  const resolveReport = async (id, action) => {
    const { data: { user } } = await supabase.auth.getUser();
    await patch(`${API}/reports/${id}/resolve`, { resolved_by: user?.id, action }, id);
  };
  const dismissReport = async (id) => {
    if (!window.confirm("Dismiss report?")) return;
    await patch(`${API}/reports/${id}/dismiss`, null, id);
  };
  const suspendReported = async (r) => {
    const reason = window.prompt(`Suspend ${r.reportedUser?.name || "user"}?`, `Reported: ${r.reason}`);
    if (reason === null) return;
    await patch(`${API}/profile/admin/users/${r.reported_user_id}/suspend`, { reason }, r.id);
    await resolveReport(r.id, "user_suspended");
  };
  const grantPremium = async (uid, name) => {
    const plan = window.prompt(`Grant plan to ${name}? Type: gold or platinum`, "gold");
    if (!plan || !["gold", "platinum"].includes(plan)) return;
    const days = window.prompt("Days?", "30");
    if (!days) return;
    await patch(`${API}/subscriptions/admin/grant/${uid}`, { plan, days: parseInt(days) }, uid);
    alert("Granted!");
  };
  const extendSub = async (uid) => {
    const days = window.prompt("Extend by days:", "30");
    if (!days) return;
    await patch(`${API}/subscriptions/admin/extend/${uid}`, { days: parseInt(days) }, uid);
    alert("Extended!");
  };
  const delSub = async (id) => {
    if (!window.confirm("Delete subscription?")) return;
    await fetch(`${API}/subscriptions/admin/${id}`, { method: "DELETE" });
    await reload();
  };

  const fUsers = users
    .filter(u => userFilter === "all" ? true : userFilter === "verified" ? u.is_verified : userFilter === "suspended" ? u.is_suspended : u.role === "admin")
    .filter(u => !search || [u.name, u.email, u.location, u.religion].some(x => (x || "").toLowerCase().includes(search.toLowerCase())));

  const fReports = reports.filter(r => reportFilter === "all" || r.status === reportFilter);
  const fSubs = subs.filter(s => subFilter === "all" ? true : subFilter === "active" ? s.status === "active" : subFilter === "gold" ? s.plan === "gold" && s.status === "active" : subFilter === "platinum" ? s.plan === "platinum" && s.status === "active" : s.status !== "active");

  const pendReports = reports.filter(r => r.status === "pending").length;
  const activeSubs = subs.filter(s => s.status === "active" && s.plan !== "free").length;

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#666" }}>Loading admin dashboard... ⏳</div>;
  if (error) return <div style={{ padding: 60, textAlign: "center" }}><p style={{ color: "#b91c1c", fontSize: 18 }}>⚠️ {error}</p><Link to="/" style={{ color: "#1e3a8a", fontWeight: "bold" }}>← Go Home</Link></div>;
  if (!isAdmin) return null;

  const S = {
    page: { maxWidth: 1400, margin: "0 auto", padding: "24px 16px" },
    h1: { color: "#1e3a8a", fontSize: 28, margin: "0 0 4px 0" },
    sub: { color: "#666", fontSize: 14, margin: 0 },
    statGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginBottom: 24 },
    stat: { background: "white", borderRadius: 12, padding: 14, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    tabs: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
    tabBtn: { border: "none", padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 8 },
    section: { background: "white", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    subTabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
    subTabBtn: { border: "none", padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
    th: { padding: "12px 10px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", whiteSpace: "nowrap", background: "#f9fafb", borderBottom: "2px solid #e5e7eb" },
    td: { padding: "12px 10px", whiteSpace: "nowrap", borderBottom: "1px solid #f3f4f6" },
    avatar: { width: 36, height: 36, borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, overflow: "hidden", flexShrink: 0 },
    btn: { border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 },
    active: { background: "#dcfce7", color: "#166534", padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 },
    sus: { background: "#fee2e2", color: "#991b1b", padding: "3px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 },
    overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 },
    modal: { background: "white", borderRadius: 16, padding: 28, maxWidth: 500, width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative" },
  };

  const TabBtn = ({ id, label, activeColor }) => (
    <button onClick={() => setTab(id)} style={{ ...S.tabBtn, background: tab === id ? activeColor : "#f3f4f6", color: tab === id ? "white" : "#374151" }}>{label}</button>
  );
  const SubTab = ({ group, id, label, color }) => {
    const [state, setState] = group === "users" ? [userFilter, setUserFilter] : group === "reports" ? [reportFilter, setReportFilter] : [subFilter, setSubFilter];
    const active = state === id;
    return <button onClick={() => setState(id)} style={{ ...S.subTabBtn, background: active ? color : "#f3f4f6", color: active ? "white" : "#374151" }}>{label}</button>;
  };

  return (
    <div style={S.page}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={S.h1}>👑 Admin Dashboard</h1>
          <p style={S.sub}>Manage your Vivaha platform</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link
            to="/admin-communities"
            style={{
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "white",
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: 14,
              boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
            }}
          >
            🏷️ Communities
          </Link>
          <Link
            to="/admin-analytics"
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
            📊 Analytics
          </Link>
          <Link
            to="/admin-settings"
            style={{
              background: "#7c3aed",
              color: "white",
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: 14,
            }}
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      {/* STAT CARDS */}
      {stats && (
        <div style={S.statGrid}>
          {[
            ["👥", "Users", stats.totalUsers, "#1e3a8a"],
            ["👨", "Male", stats.maleUsers, "#2563eb"],
            ["👩", "Female", stats.femaleUsers, "#db2777"],
            ["💬", "Messages", stats.totalMessages, "#16a34a"],
            ["✔️", "Verified", stats.verifiedUsers, "#059669"],
            ["🚫", "Suspended", stats.suspendedUsers, "#dc2626"],
            ["⭐", "Premium", activeSubs, "#f59e0b"],
            ["💰", "MRR", `₹${subStats?.mrr || 0}`, "#16a34a"],
          ].map(([ic, lb, v, c]) => (
            <div key={lb} style={{ ...S.stat, borderTop: `4px solid ${c}` }}>
              <div style={{ fontSize: 22 }}>{ic}</div>
              <div style={{ fontSize: 20, fontWeight: "bold", color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: "#666" }}>{lb}</div>
            </div>
          ))}
        </div>
      )}

      {/* MAIN TABS */}
      <div style={S.tabs}>
        <TabBtn id="users" label={`👥 Users (${users.length})`} activeColor="#1e3a8a" />
        <TabBtn id="reports" label={`🚨 Reports (${pendReports})`} activeColor="#dc2626" />
        <TabBtn id="subscriptions" label={`⭐ Subscriptions (${activeSubs})`} activeColor="#f59e0b" />
      </div>

      {/* USERS TAB */}
      {tab === "users" && (
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, color: "#1e3a8a", fontSize: 20 }}>All Users ({fUsers.length})</h2>
            <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, minWidth: 250, flex: 1, maxWidth: 400 }} />
          </div>
          <div style={S.subTabs}>
            <SubTab group="users" id="all" label={`All (${users.length})`} color="#1e3a8a" />
            <SubTab group="users" id="verified" label={`✔️ Verified (${users.filter(u => u.is_verified).length})`} color="#059669" />
            <SubTab group="users" id="suspended" label={`🚫 Suspended (${users.filter(u => u.is_suspended).length})`} color="#dc2626" />
            <SubTab group="users" id="admins" label={`👑 Admins (${users.filter(u => u.role === "admin").length})`} color="#f59e0b" />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>Photo</th><th style={S.th}>Name</th><th style={S.th}>Email</th><th style={S.th}>Age</th><th style={S.th}>Gender</th><th style={S.th}>Status</th><th style={S.th}>Role</th><th style={S.th}>Actions</th>
              </tr></thead>
              <tbody>
                {fUsers.map(u => (
                  <tr key={u.id} style={{ opacity: busy === u.id ? 0.5 : 1, background: u.is_suspended ? "#fef2f2" : "transparent" }}>
                    <td style={S.td}><div style={S.avatar}>{u.photo_url ? <img src={u.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}</div></td>
                    <td style={S.td}>{u.name || "—"}{u.is_verified && " ✔️"}</td>
                    <td style={{ ...S.td, fontSize: 12, color: "#666" }}>{u.email || "—"}</td>
                    <td style={S.td}>{u.age || "—"}</td>
                    <td style={S.td}>{u.gender || "—"}</td>
                    <td style={S.td}>{u.is_suspended ? <span style={S.sus}>🚫 Suspended</span> : <span style={S.active}>● Active</span>}</td>
                    <td style={S.td}>
                      <select value={u.role || "user"} onChange={e => changeRole(u.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 12 }}>
                        <option value="user">👤 User</option><option value="admin">👑 Admin</option>
                      </select>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        <button onClick={() => viewUser(u.id)} style={{ ...S.btn, background: "#eff6ff", color: "#1e40af" }}>👁️</button>
                        <button onClick={() => verify(u.id, u.is_verified)} style={{ ...S.btn, background: u.is_verified ? "#fef3c7" : "#dcfce7", color: u.is_verified ? "#92400e" : "#166534" }}>{u.is_verified ? "✖️" : "✔️"}</button>
                        {u.is_suspended ? (
                          <button onClick={() => unsuspend(u.id)} style={{ ...S.btn, background: "#dcfce7", color: "#166534" }}>✅</button>
                        ) : (
                          <button onClick={() => suspend(u.id, u.name)} style={{ ...S.btn, background: "#fee2e2", color: "#991b1b" }}>🚫</button>
                        )}
                        {u.role !== "admin" && <button onClick={() => delUser(u.id, u.name)} style={{ ...S.btn, background: "#fee2e2", color: "#b91c1c" }}>🗑️</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORTS TAB */}
      {tab === "reports" && (
        <div style={S.section}>
          <h2 style={{ margin: 0, color: "#1e3a8a", fontSize: 20, marginBottom: 16 }}>Reports ({fReports.length})</h2>
          <div style={S.subTabs}>
            <SubTab group="reports" id="pending" label={`🚨 Pending (${reports.filter(r => r.status === "pending").length})`} color="#dc2626" />
            <SubTab group="reports" id="resolved" label={`✅ Resolved (${reports.filter(r => r.status === "resolved").length})`} color="#16a34a" />
            <SubTab group="reports" id="dismissed" label={`✖️ Dismissed (${reports.filter(r => r.status === "dismissed").length})`} color="#6b7280" />
            <SubTab group="reports" id="all" label={`📋 All (${reports.length})`} color="#1e3a8a" />
          </div>
          {fReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}><div style={{ fontSize: 60 }}>🎉</div><p style={{ color: "#666" }}>No {reportFilter} reports.</p></div>
          ) : fReports.map(r => (
            <div key={r.id} style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12, opacity: busy === r.id ? 0.6 : 1 }}>
              <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ background: r.status === "pending" ? "#fef3c7" : r.status === "resolved" ? "#dcfce7" : "#e5e7eb", color: r.status === "pending" ? "#92400e" : r.status === "resolved" ? "#166534" : "#4b5563", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                  {r.status === "pending" ? "🚨 Pending" : r.status === "resolved" ? "✅ Resolved" : "✖️ Dismissed"}
                </span>
                <span style={{ fontSize: 12, color: "#666", marginLeft: 10 }}>{new Date(r.created_at).toLocaleString("en-IN")}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                <div style={{ background: "white", padding: 10, borderRadius: 8 }}><p style={{ margin: 0, fontSize: 11, color: "#888", fontWeight: 600 }}>👤 REPORTED</p><p style={{ margin: 0, color: "#1e3a8a", fontWeight: 600 }}>{r.reportedUser?.name || "Unknown"}</p></div>
                <div style={{ background: "white", padding: 10, borderRadius: 8 }}><p style={{ margin: 0, fontSize: 11, color: "#888", fontWeight: 600 }}>📢 BY</p><p style={{ margin: 0, color: "#1e3a8a", fontWeight: 600 }}>{r.reporter?.name || "Unknown"}</p></div>
                <div style={{ background: "white", padding: 10, borderRadius: 8 }}><p style={{ margin: 0, fontSize: 11, color: "#888", fontWeight: 600 }}>⚠️ REASON</p><p style={{ margin: 0, color: "#1e3a8a", fontWeight: 600, textTransform: "capitalize" }}>{(r.reason || "").replace(/_/g, " ")}</p></div>
              </div>
              {r.status === "pending" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                  <button onClick={() => viewUser(r.reported_user_id)} style={{ ...S.btn, background: "#eff6ff", color: "#1e40af", padding: "8px 14px" }}>👁️ View</button>
                  <button onClick={() => suspendReported(r)} style={{ ...S.btn, background: "#fee2e2", color: "#991b1b", padding: "8px 14px" }}>🚫 Suspend</button>
                  <button onClick={() => resolveReport(r.id, "resolved")} style={{ ...S.btn, background: "#dcfce7", color: "#166534", padding: "8px 14px" }}>✅ Resolve</button>
                  <button onClick={() => dismissReport(r.id)} style={{ ...S.btn, background: "#e5e7eb", color: "#4b5563", padding: "8px 14px" }}>✖️ Dismiss</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SUBSCRIPTIONS TAB */}
      {tab === "subscriptions" && (
        <div style={S.section}>
          {subStats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
              {[
                [`₹${subStats.totalRevenue}`, "Total Revenue", "#dcfce7", "#166534"],
                [`₹${subStats.mrr}`, "Current MRR", "#fef3c7", "#92400e"],
                [subStats.activeSubscriptions, "Active Subs", "#dbeafe", "#1e40af"],
                [subStats.goldCount, "Gold", "#fef9c3", "#854d0e"],
                [subStats.platinumCount, "Platinum", "#fce7f3", "#9f1239"],
              ].map(([v, l, bg, c]) => (
                <div key={l} style={{ background: bg, padding: 14, borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: c }}>{v}</div>
                  <div style={{ fontSize: 12, color: c }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          <h2 style={{ margin: 0, color: "#1e3a8a", fontSize: 20, marginBottom: 16 }}>All Subscriptions ({fSubs.length})</h2>
          <div style={S.subTabs}>
            <SubTab group="subs" id="all" label={`All (${subs.length})`} color="#f59e0b" />
            <SubTab group="subs" id="active" label={`✓ Active (${subs.filter(s => s.status === "active").length})`} color="#16a34a" />
            <SubTab group="subs" id="gold" label={`🥇 Gold (${subs.filter(s => s.plan === "gold" && s.status === "active").length})`} color="#f59e0b" />
            <SubTab group="subs" id="platinum" label={`💎 Platinum (${subs.filter(s => s.plan === "platinum" && s.status === "active").length})`} color="#db2777" />
            <SubTab group="subs" id="expired" label={`⏰ Expired (${subs.filter(s => s.status !== "active").length})`} color="#6b7280" />
          </div>
          {fSubs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}><div style={{ fontSize: 60 }}>💳</div><p style={{ color: "#666" }}>No subscriptions yet.</p></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>User</th><th style={S.th}>Plan</th><th style={S.th}>Amount</th><th style={S.th}>Status</th><th style={S.th}>Started</th><th style={S.th}>Expires</th><th style={S.th}>Actions</th>
                </tr></thead>
                <tbody>
                  {fSubs.map(s => (
                    <tr key={s.id}>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={S.avatar}>{s.user?.photo_url ? <img src={s.user.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}</div>
                          <div><div style={{ fontSize: 13, fontWeight: 600, color: "#1e3a8a" }}>{s.user?.name || "Unknown"}</div><div style={{ fontSize: 11, color: "#888" }}>{s.user?.email}</div></div>
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ background: s.plan === "platinum" ? "#fce7f3" : s.plan === "gold" ? "#fef3c7" : "#e5e7eb", color: s.plan === "platinum" ? "#9f1239" : s.plan === "gold" ? "#92400e" : "#4b5563", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                          {s.plan === "platinum" ? "💎" : s.plan === "gold" ? "🥇" : "👤"} {s.plan}
                        </span>
                      </td>
                      <td style={S.td}>₹{s.amount || 0}</td>
                      <td style={S.td}>{s.status === "active" ? <span style={S.active}>● Active</span> : <span style={{ ...S.sus, background: "#e5e7eb", color: "#4b5563" }}>{s.status}</span>}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{s.started_at ? new Date(s.started_at).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{s.expires_at ? new Date(s.expires_at).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => grantPremium(s.user_id, s.user?.name)} style={{ ...S.btn, background: "#eff6ff", color: "#1e40af" }}>🎁</button>
                          {s.status === "active" && s.plan !== "free" && <button onClick={() => extendSub(s.user_id)} style={{ ...S.btn, background: "#dcfce7", color: "#166534" }}>➕</button>}
                          <button onClick={() => delSub(s.id)} style={{ ...S.btn, background: "#fee2e2", color: "#b91c1c" }}>🗑️</button>
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
        <div style={S.overlay} onClick={() => setSelectedUser(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} style={{ position: "absolute", top: 12, right: 12, background: "#f3f4f6", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer" }}>✕</button>
            <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>{selectedUser.name || "Anonymous"}</h2>
            {["email", "age", "gender", "religion", "caste", "location", "education", "occupation", "income", "marital_status", "community", "role"].map(k => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", padding: "6px 0" }}>
                <span style={{ color: "#666", fontSize: 13 }}>{k.replace(/_/g, " ")}:</span>
                <span style={{ fontWeight: 600, color: "#1e3a8a", fontSize: 13 }}>{selectedUser[k] || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;