import React from "react";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import supabase from "../supabaseClient";

/**
 * ProtectedRoute ensures only logged-in users (and optionally specific roles)
 * can access certain routes. If not authenticated, redirects to /login.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        // Fetch user role from 'users' table
        supabase
          .from("users")
          .select("role")
          .eq("id", data.session.user.id)
          .single()
          .then(({ data: profile }) => {
            setUserRole(profile?.role || "user");
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          supabase
            .from("users")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data: profile }) => {
              setUserRole(profile?.role || "user");
            });
        } else {
          setUserRole(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check role access if allowedRoles is provided
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;