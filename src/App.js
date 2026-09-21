import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProfileSearch from "./pages/ProfileSearch";
import Matches from "./pages/Matches";
import Recommendations from "./pages/Recommendations";
import Subscription from "./pages/Subscription";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";
// import AdminDashboard from "./pages/AdminDashboard";
// import AdminAnalytics from "./pages/AdminAnalytics";
import Messages from "./pages/Messages";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><ProfileSearch /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="/subscription-dashboard" element={<ProtectedRoute><SubscriptionDashboard /></ProtectedRoute>} />

        {/* Admin routes temporarily disabled until AdminDashboard.js is fixed */}
        {/* <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} /> */}
        {/* <Route path="/admin-analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} /> */}
      </Routes>
    </Router>
  );
}

export default App;