import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";

function Register() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Registered successfully! Welcome to Vivaha!");
      navigate("/profile");
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      style={{
        maxWidth: "400px",
        margin: "60px auto",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <h2 style={{ textAlign: "center", color: "#1e3a8a", margin: 0 }}>
        Register
      </h2>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        Register
      </button>
    </form>
  );
}

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