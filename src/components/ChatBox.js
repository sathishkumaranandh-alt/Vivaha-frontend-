import React, { useState, useEffect } from "react";
import supabase from "../supabaseClient";

function ChatBox({ userId, partnerId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("timestamp", { ascending: true })
      .then(({ data }) => setMessages(data));
  }, [userId]);

  const sendMessage = async () => {
    await supabase.from("messages").insert([
      { sender_id: userId, receiver_id: partnerId, text }
    ]);
    setText("");
  };

  return (
    <div>
      <h3>Chat</h3>
      <div>
        {messages.map((m) => (
          <p key={m.id}>{m.sender_id}: {m.text}</p>
        ))}
      </div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatBox;
