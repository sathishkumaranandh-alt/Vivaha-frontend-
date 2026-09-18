import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";

function Recommendations({ userId }) {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function fetchRecommendations() {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .limit(5); // placeholder for AI logic
      if (!error) setRecommendations(data);
    }
    fetchRecommendations();
  }, [userId]);

  return (
    <div>
      <h2>Recommended Profiles</h2>
      <ul>
        {recommendations.map((r) => (
          <li key={r.id}>{r.name} — {r.age} — {r.location}</li>
        ))}
      </ul>
    </div>
  );
}

export default Recommendations;
    
