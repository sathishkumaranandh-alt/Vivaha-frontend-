import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

const COMMUNITIES = [
  { value: "vanniyar", label: "Vanniyar" },
  { value: "naidu", label: "Naidu" },
  { value: "kallar", label: "Kallar" },
  { value: "thevar", label: "Thevar" },
  { value: "other", label: "Other" },
];

function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    community: "",
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!form.community) {
      toast.error("Please select your community");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { community: form.community },
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    // Save community to users table
    if (data?.user) {
      await supabase.from("users").upsert([
        {
          id: data.user.id,
          email: form.email,
          community: form.community,
        },
      ]);
    }

    toast.success("Registered successfully! Welcome to Vivaha!");
    navigate("/profile");
  };

  return (
    <form onSubmit={handleRegister} style={formStyle}>
      <h2 style={{ textAlign: "center", color: "#1e3a8a", margin: 0 }}>
        Register
      </h2>

      <input
        type="email"
        placeholder="Email"
        required
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        style={inputStyle}
      />

      <input
        type="password"
        placeholder="Password"
        required
        minLength={6}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        style={inputStyle}
      />

      <select
        value={form.community}
        onChange={(e) => setForm({ ...form, community: e.target.value })}
        style={inputStyle}
        required
      >
        <option value="">Select Your Community</option>
        {COMMUNITIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <button type="submit" style={buttonStyle}>
        Register
      </button>

      <p style={{ textAlign: "center", color: "#666", fontSize: "13px", margin: 0 }}>
        Your matches will only show profiles from the same community.
      </p>
    </form>
  );
}

const formStyle = {
  maxWidth: "400px",
  margin: "60px auto",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "15px",
  fontFamily: "inherit",
};

const buttonStyle = {
  padding: "12px",
  background: "#1e3a8a",
  color: "white",
  border: "none",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

export default Register;