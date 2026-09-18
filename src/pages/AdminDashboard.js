import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";

function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("users").select("*");
      if (!error) setUsers(data);
    }
    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name} — {u.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default AdminDashboard;
