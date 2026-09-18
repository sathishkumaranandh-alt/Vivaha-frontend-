import React, { useState } from "react";
import supabase from "../supabaseClient";

function Register() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (error) alert(error.message);
    else alert("Registered successfully!");
  };

  return (
    <form onSubmit={handleRegister}>
      <input type="email" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button type="submit">Register</button>
    </form>
  );
}
export default Register;
