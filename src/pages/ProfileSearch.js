import React, { useState, useEffect } from "react";
import supabase from "../supabaseClient";

function ProfileSearch() {
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function fetchProfiles() {
      let query = supabase.from("users").select("*");
      if (filter) query = query.ilike("religion", `%${filter}%`);
      const { data, error } = await query;
      if (!error) setProfiles(data);
    }
    fetchProfiles();
  }, [filter]);

  return (
    <div>
      <h2>Search Profiles</h2>
      <input
        placeholder="Filter by religion"
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul>
        {profiles.map((p) => (
          <li key={p.id}>{p.name} — {p.age} — {p.religion}</li>
        ))}
      </ul>
    </div>
  );
}

export default ProfileSearch;
  
