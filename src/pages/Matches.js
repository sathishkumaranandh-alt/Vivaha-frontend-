import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";

function Matches({ userId }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    async function fetchMatches() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "match");
      if (!error) setMatches(data);
    }
    fetchMatches();
  }, [userId]);

  return (
    <div>
      <h2>Your Matches</h2>
      <ul>
        {matches.map((m) => (
          <li key={m.id}>{m.content}</li>
        ))}
      </ul>
    </div>
  );
}

export default Matches;
          
