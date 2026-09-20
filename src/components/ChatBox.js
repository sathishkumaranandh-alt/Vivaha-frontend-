import React, { useState, useEffect, useRef } from "react";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ChatBox({
  userId,
  partnerId,
  partnerName,
  partnerPhoto,
  onMessageSent,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        const res = await fetch(
          `${BACKEND_URL}/messages/chat/${userId}/${partnerId}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Load chat error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (userId && partnerId) loadMessages();
  }, [userId, partnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!userId || !partnerId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/messages/chat/${userId}/${partnerId}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        /* silent */
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, partnerId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    try {
      setSending(true);
      const msgText = text.trim();
      setText("");

      const res = await fetch(`${BACKEND_URL}/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: partnerId,
          text: msgText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.data]);
        if (onMessageSent) onMessageSent();
      } else {
        setText(msgText);
        alert("Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("Send error:", err);
      alert("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={wrapperStyle}>
      <div style={headerStyle}>
        <div style={headerAvatarStyle}>
          {partnerPhoto ? (
            <img
              src={partnerPhoto}
              alt={partnerName}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            "👤"
          )}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: "600", color: "#1e3a8a" }}>
            {partnerName}
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#22c55e" }}>
            ● Online
          </p>
        </div>
      </div>

      <div style={messagesAreaStyle}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#888" }}>
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "#888", marginBottom: "8px" }}>
              No messages yet 👋
            </p>
            <p style={{ color: "#aaa", fontSize: "13px" }}>
              Say hi to {partnerName} to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === userId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={inputBarStyle}>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
          style={textInputStyle}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{
            ...sendButtonStyle,
            opacity: sending || !text.trim() ? 0.5 : 1,
            cursor: sending || !text.trim() ? "not-allowed" : "pointer",
          }}
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        marginBottom: "8px",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "10px 14px",
          borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isOwn ? "#1e3a8a" : "#f3f4f6",
          color: isOwn ? "white" : "#1f2937",
          fontSize: "14px",
          lineHeight: "1.5",
          wordWrap: "break-word",
        }}
      >
        <p style={{ margin: 0 }}>{message.text}</p>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "10px",
            opacity: 0.7,
            textAlign: "right",
          }}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const wrapperStyle = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  borderBottom: "1px solid #e5e7eb",
  background: "white",
};

const headerAvatarStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  background: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  overflow: "hidden",
  flexShrink: 0,
};

const messagesAreaStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "16px",
  background: "#fafafa",
};

const inputBarStyle = {
  display: "flex",
  gap: "8px",
  padding: "12px",
  borderTop: "1px solid #e5e7eb",
  background: "white",
};

const textInputStyle = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: "24px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
};

const sendButtonStyle = {
  background: "#1e3a8a",
  color: "white",
  border: "none",
  padding: "10px 24px",
  borderRadius: "24px",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

export default ChatBox;