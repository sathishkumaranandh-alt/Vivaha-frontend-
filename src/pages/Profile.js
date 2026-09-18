import React, { useState } from "react";
import supabase from "../supabaseClient";

function Profile() {
  const [profile, setProfile] = useState({ name: "", age: "", religion: "", location: "" });

  const handleSave = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("users").upsert([profile]);
    if (error) alert(error.message);
    else alert("Profile saved!");
  };

  return (
    <form onSubmit={handleSave}>
      <input placeholder="Name" onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
      <input placeholder="Age" type="number" onChange={(e) => setProfile({ ...profile, age: e.target.value })} />
      <input placeholder="Religion" onChange={(e) => setProfile({ ...profile, religion: e.target.value })} />
      <input placeholder="Location" onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
      <button type="submit">Save Profile</button>
    </
