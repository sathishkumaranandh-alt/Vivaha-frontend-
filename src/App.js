import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import supabase from "./supabaseClient";
import Navbar from "./components/Navigation";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallAppButton from "./components/InstallAppButton";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import { apiFetch } from "./utils/api";

import Home from "./pages/Home";
import SuccessStories from "./pages/SuccessStories";
import AdminSuccessStories from "./pages/AdminSuccessStories";
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
import AdminUserPermissions from "./pages/AdminUserPermissions";
import AdminFormBuilder from "./pages/AdminFormBuilder";
import Messages from "./pages/Messages";
import Interests from "./pages/Interests";
import PhotoRequests from "./pages/PhotoRequests";
import ContactRequests from "./pages/ContactRequests";
import Dashboard from "./pages/Dashboard";
import Visitors from "./pages/Visitors";
import Boost from "./pages/Boost";
import AdminPlans from "./pages/AdminPlans";
import AdvancedSearch from "./pages/AdvancedSearch";
import ScrollToTop from "./components/ScrollToTop";
import Onboarding from "./pages/Onboarding";
import Discover from "./pages/Discover";
import ProfileDetail from "./pages/ProfileDetail";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const HEARTBEAT_INTERVAL = 60000; // 60 seconds

function App() {
  const [pageBg, setPageBg] = useState("#FFF9F5");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const currentUserIdRef = useRef(null);

  // ============================================
  // 1. BODY STYLES + SETTINGS FETCH
  // ============================================
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";

    fetch(`${BACKEND_URL}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings && data.settings.global_page_bg) {
          setPageBg(data.settings.global_page_bg);
          document.body.style.backgroundColor = data.settings.global_page_bg;
          document.documentElement.style.backgroundColor =
            data.settings.global_page_bg;
        }
      })
      .catch(console.error);
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
      <div style={{position:"fixed",top:0,left:0,right:0,background:"#dc2626",color:"white",textAlign:"center",fontSize:"11px",padding:"3px",zIndex:999999,fontWeight:"bold",fontFamily:"monospace",letterSpacing:"1px"}}>
        🔥 CODE-V5 · {currentUserId ? "AUTH" : "GUEST"} · {sessionReady ? "READY" : "..."}
      </div>
      <ScrollToTop />

      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: pageBg,
          overflowX: "hidden",
          margin: 0,
          padding: 0,
        }}
      >
        <Navbar />
        <div style={{ width: "100%", margin: 0, padding: 0 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/login" element={<Login />} />
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
            <Route path="/admin/success-stories" element={<AdminSuccessStories />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Routes>
        </div>
        <Footer />
        <InstallAppButton />
        <PWAInstallPrompt />
      </div>
    </Router>
  );
}

export default App; 
