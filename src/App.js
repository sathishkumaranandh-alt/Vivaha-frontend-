import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import supabase from "./supabaseClient";
import Navbar from "./components/Navigation";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallAppButton from "./components/InstallAppButton";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { apiFetch } from "./utils/api";
import { applyVgTheme } from "./utils/vgThemes";

import Home from "./pages/Home";
import Login from "./pages/Login";
import { useBrand } from "./utils/brand";
import ScrollToTop from "./components/ScrollToTop";

// ⚡ Speed: each page is downloaded only when it is opened (smaller first load)
const SuccessStories = lazy(() => import("./pages/SuccessStories"));
const AdminSuccessStories = lazy(() => import("./pages/AdminSuccessStories"));
const Register = lazy(() => import("./pages/Register"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Legal = lazy(() => import("./pages/Legal"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileSearch = lazy(() => import("./pages/ProfileSearch"));
const Matches = lazy(() => import("./pages/Matches"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const UserSettings = lazy(() => import("./pages/UserSettings"));
const Subscription = lazy(() => import("./pages/Subscription"));
const SubscriptionDashboard = lazy(() => import("./pages/SubscriptionDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminCommunities = lazy(() => import("./pages/AdminCommunities"));
const AdminUserPermissions = lazy(() => import("./pages/AdminUserPermissions"));
const AdminFormBuilder = lazy(() => import("./pages/AdminFormBuilder"));
const Messages = lazy(() => import("./pages/Messages"));
const Interests = lazy(() => import("./pages/Interests"));
const PhotoRequests = lazy(() => import("./pages/PhotoRequests"));
const ContactRequests = lazy(() => import("./pages/ContactRequests"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Visitors = lazy(() => import("./pages/Visitors"));
const Boost = lazy(() => import("./pages/Boost"));
const AdminPlans = lazy(() => import("./pages/AdminPlans"));
const AdvancedSearch = lazy(() => import("./pages/AdvancedSearch"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Discover = lazy(() => import("./pages/Discover"));
const ProfileDetail = lazy(() => import("./pages/ProfileDetail"));

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const HEARTBEAT_INTERVAL = 60000; // 60 seconds

function App() {
  const brand = useBrand();
  useEffect(() => {
    document.title = `${brand.name} — Find Your Life Partner`;
  }, [brand.name]);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const currentUserIdRef = useRef(null);

  // ============================================
  // 1. BODY STYLES (page background comes from styles/glass-theme.css)
  // ============================================
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
  }, []);

  // ============================================
  // 1b. SITE THEME — the admin chooses it (Admin Settings → Site → Site Theme)
  // ============================================
  useEffect(() => {
    let alive = true;
    const loadTheme = async () => {
      try {
        const res = await apiFetch("/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (alive && data?.settings?.global_theme) applyVgTheme(data.settings.global_theme);
      } catch { /* keep the cached theme */ }
    };
    loadTheme();
    window.addEventListener("theme-refresh", loadTheme);
    return () => { alive = false; window.removeEventListener("theme-refresh", loadTheme); };
  }, []);

  // ============================================
  // 2. GET CURRENT USER (auth listener — reliable)
  // ============================================
  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      currentUserIdRef.current = session?.user?.id || null;
      setCurrentUserId(session?.user?.id || null);
      setSessionReady(true);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        currentUserIdRef.current = session?.user?.id || null;
        setCurrentUserId(session?.user?.id || null);
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // ============================================
  // 3. HEARTBEAT — via apiFetch (JWT)
  // ============================================
  useEffect(() => {
    if (!sessionReady || !currentUserId) return;

    let intervalId = null;
    let isActive = true;

    const sendHeartbeat = () => {
      if (!isActive || !currentUserIdRef.current) return;
      apiFetch("/messages/heartbeat", { method: "POST" }).catch(() => {});
    };

    const startHeartbeat = () => {
      sendHeartbeat();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    };

    const stopHeartbeat = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        isActive = true;
        startHeartbeat();
      } else {
        isActive = false;
        stopHeartbeat();
      }
    };

    // beforeunload — use sendBeacon with legacy user_id (can't use JWT)
    const handleBeforeUnload = () => {
      const uid = currentUserIdRef.current;
      if (!uid) return;
      const url = `${BACKEND_URL}/messages/heartbeat`;
      const data = JSON.stringify({ user_id: uid });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          url,
          new Blob([data], { type: "application/json" })
        );
      }
    };

    if (document.visibilityState === "visible") {
      startHeartbeat();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUserId, sessionReady]);

  // ============================================
  // 4. LOGOUT — legacy fallback
  // ============================================
  useEffect(() => {
    if (!currentUserId) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" && currentUserId) {
          fetch(`${BACKEND_URL}/messages/heartbeat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUserId }),
          }).catch(() => {});
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [currentUserId]);

  return (
    <Router>
      <ScrollToTop />

      <div className="vivaha-app" style={{ margin: 0, padding: 0 }}>
        <Navbar />
        <div className="vivaha-main">
          <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--vg-muted, #777)", fontSize: 15 }}>Loading…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/terms" element={<Legal doc="terms" />} />
            <Route path="/privacy" element={<Legal doc="privacy" />} />
            <Route path="/refund" element={<Legal doc="refund" />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><ProfileSearch /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
            <Route path="/visitors" element={<ProtectedRoute><Visitors /></ProtectedRoute>} />
            <Route path="/photo-requests" element={<ProtectedRoute><PhotoRequests /></ProtectedRoute>} />
            <Route path="/contact-requests" element={<ProtectedRoute><ContactRequests /></ProtectedRoute>} />
            <Route path="/boost" element={<ProtectedRoute><Boost /></ProtectedRoute>} />
            <Route path="/admin-plans" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPlans /></ProtectedRoute>} />
            <Route path="/admin-user-permissions/:userId" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUserPermissions /></ProtectedRoute>} />
            <Route path="/advanced-search" element={<ProtectedRoute><AdvancedSearch /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/subscription-dashboard" element={<ProtectedRoute><SubscriptionDashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin-analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin-communities" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCommunities /></ProtectedRoute>} />
            <Route path="/admin-settings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin-form-builder" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFormBuilder /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/match/:id" element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>} />
            <Route path="/admin/success-stories" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSuccessStories /></ProtectedRoute>} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </div>
        <Footer />
        <InstallAppButton />
        <PWAInstallPrompt />
      </div>
    </Router>
  );
}

export default App;
  
