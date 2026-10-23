import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import supabase from "../supabaseClient";

/**
 * ProtectedRoute: only logged-in users (and optionally specific roles) can
 * open these pages. Not logged in -> /login.
 *
 * The session + role are cached at module level, so moving between pages does
 * not re-fetch them. That removes the "Loading..." flash that used to collapse
 * the page and make the footer jump up under the navbar on every navigation.
 */
let cached = null; // { session, role }
let inflight = null;
const listeners = new Set();

function publish(value) {
  cached = value;
  listeners.forEach((fn) => fn(value));
}

async function fetchRole(userId) {
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return profile?.role || "user";
}

function loadAuth() {
  if (!inflight) {
    inflight = (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;
        const role = session?.user ? await fetchRole(session.user.id) : null;
        publish({ session, role });
      } catch (e) {
        publish({ session: null, role: null });
      } finally {
        inflight = null;
      }
      return cached;
    })();
  }
  return inflight;
}

// Keep the cache fresh on login / logout
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session?.user) {
    publish({ session: null, role: null });
    return;
  }
  if (cached?.session?.user?.id === session.user.id) {
    publish({ ...cached, session });
    return;
  }
  cached = null; // new / different user -> reload the role
  setTimeout(loadAuth, 0);
});

const centerBox = {
  minHeight: "55vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  padding: "40px 20px",
  textAlign: "center",
  color: "var(--vg-text)",
};

function ProtectedRoute({ children, allowedRoles }) {
  const [auth, setAuth] = useState(cached);

  useEffect(() => {
    listeners.add(setAuth);
    if (cached) setAuth(cached);
    else loadAuth();
    return () => listeners.delete(setAuth);
  }, []);

  if (!auth) {
    return (
      <div style={centerBox}>
        <div className="vg-spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (!auth.session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return (
      <div style={centerBox}>
        <h2 style={{ margin: "0 0 8px" }}>Access Denied</h2>
        <p style={{ margin: 0 }}>You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
