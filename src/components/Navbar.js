import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <Link to="/">Home</Link> | 
      <Link to="/register">Register</Link> | 
      <Link to="/login">Login</Link> | 
      <Link to="/profile">Profile</Link> | 
      <Link to="/search">Search</Link> | 
      <Link to="/matches">Matches</Link> | 
      <Link to="/recommendations">Recommendations</Link> | 
      <Link to="/subscription">Subscription</Link> | 
      <Link to="/subscription-dashboard">My Subscription</Link> | 
      <Link to="/admin">Admin</Link> | 
      <Link to="/admin-analytics">Analytics</Link>
    </nav>
  );
}

export default Navbar;
