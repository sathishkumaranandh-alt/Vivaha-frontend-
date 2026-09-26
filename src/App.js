import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navigation";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallAppButton from "./components/InstallAppButton";

// Pages
import Home from "./pages/Home";
import SuccessStories from "./pages/SuccessStories";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProfileSearch from "./pages/ProfileSearch";
import Matches from "./pages/Matches";
import Recommendations from "./pages/Recommendations";
import UserSettings from "./pages/UserSettings";
import Subscription from "./pages/Subscription";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import AdminCommunities from "./pages/AdminCommunities";
import Messages from "./pages/Messages";
import Interests from "./pages/Interests";
import Dashboard from "./pages/Dashboard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function App() {
  const [maintenance, setMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings && data.settings.maintenance_mode === "true") {
          setMaintenance(true);
        }
      })
      .catch(console.error)
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <div style={{ padding: 60, textAlign: "center" }}>Loading...</div>;

  // Allow admins to bypass maintenance mode
  const isAdminPath = window.location.pathname.startsWith("/admin");

  if (maintenance && !isAdminPath) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FFF9F5", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛠️</div>
        <h1 style={{ color: "#8B0A2E", marginBottom: 8 }}>Under Maintenance</h1>
        <p style={{ color: "#666", maxWidth: 400, lineHeight: 1.6 }}>
          We are currently updating the site to serve you better. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><ProfileSearch /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="/subscription-dashboard" element={<ProtectedRoute><SubscriptionDashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin-analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin-communities" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCommunities /></ProtectedRoute>} />
        <Route path="/admin-settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
      </Routes>
      <Footer />
      <InstallAppButton />
    </Router>
  );
}

export default App;
