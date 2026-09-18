import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProfileSearch from "./pages/ProfileSearch";
import Matches from "./pages/Matches";
import Recommendations from "./pages/Recommendations";
import Subscription from "./pages/Subscription";
import SubscriptionDashboard from "./pages/SubscriptionDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<ProfileSearch />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/subscription-dashboard" element={<SubscriptionDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-analytics" element={<AdminAnalytics />} />
      </Routes>
    </Router>
  );
}

export default App;
