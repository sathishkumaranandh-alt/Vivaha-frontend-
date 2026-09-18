import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";

function Notifications({ userId }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .then(({ data }) => setNotifications(data));
  }, [userId]);

  return (
    <div>
      <h3>Notifications</h3>
      <ul>
        {notifications.map((n) => (
          <li key={n.id}>{n.type}: {n.content}</li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
