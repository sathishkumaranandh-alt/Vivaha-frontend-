import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function ChatBox({
  userId,
  partnerId,
  partnerName,
  partnerPhoto,
  onMessageSent,
  hideHeader = false,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connStatus, setConnStatus] = useState(null);
  const messagesEndRef = useRef(null);

  // ============================================================
  // CHECK CONNECTION STATUS
  // ============================================================
  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch(
          `${BACKEND_URL}/interests/status/${userId}/${partnerId}`
        );
        if (res.ok) {
          const data = await res.json();
          setConnStatus(data); // { status, direction }
        } else {
          setConnStatus({ status: "none" });
        }
      } catch (err) {
        setConnStatus({ status: "none" });
      }
    }
    if (userId && partnerId) checkConnection();
  }, [userId, partnerId]);

  // ============================================================
  // LOAD MESSAGES (only if connected)
  // ============================================================
  useEffect(() => {
    async function loadMessages() {
      if (!connStatus || connStatus.status !== "accepted") {
        setLoading(false);
        return;
      }
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
    loadMessages();
  }, [userId, partnerId, connStatus]);

  // Mark as read + auto-scroll + polling
  useEffect(() => {
    if (connStatus?.status !== "accepted") return;
    if (!userId || !partnerId) return;

    fetch(`${BACKEND_URL}/messages/mark-read/${userId}/${partnerId}`, {
      method: "PATCH",
    }).catch(() => {});

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/messages/chat/${userId}/${partnerId}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [userId, partnerId, connStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================================
  // SEND MESSAGE
  // ============================================================
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

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, data.data]);
        if (onMessageSent) onMessageSent();
      } else {
        setText(msgText);
        alert(data.error || "Failed to send message.");
      }
    } catch (err) {
      console.error("Send error:", err);
      alert("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (!connStatus) {
    return (
      <div style={wrapperStyle}>
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          Checking connection...
        </div>
      </div>
    );
  }

  // ============================================================
  // NOT CONNECTED — show lock screen
  // ============================================================
  if (connStatus.status !== "accepted") {
    return (
      <LockedChat
        partnerName={partnerName}
        partnerId={partnerId}
        status={connStatus.status}
        direction={connStatus.direction}
      />
    );
  }

  // ============================================================
  // CONNECTED — normal chat UI
  // ============================================================
  return (
    <div style={wrapperStyle}>
      {!hideHeader && (
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
            <p style={{ margin: 0, fontSize: "11px", color: "#22c55e" }}>
              ✅ Connected
            </p>
          </div>
        </div>
      )}

      <div style={messagesAreaStyle}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#888" }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "#888", marginBottom: "8px" }}>No messages yet 👋</p>
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

// ============================================================
// LOCKED CHAT SCREEN
// ============================================================
function LockedChat({ partnerName, partnerId, status, direction }) {
  // Determine what to show based on status
  let icon = "🔒";
  let title = "Messaging Locked";
  let message = "";
  let actionBtn = null;

  if (status === "none") {
    title = "Send Interest First";
    message = `You need to send ${partnerName} an interest before you can message them.`;
    actionBtn = (
      <Link to={`/profile/${partnerId}`} style={lockedPrimaryBtn}>
        💌 View Profile & Send Interest
      </Link>
    );
  } else if (status === "pending" && direction === "sent") {
    icon = "⏳";
    title = "Waiting for Acceptance";
    message = `${partnerName} hasn't accepted your interest yet. You'll be able to message once they accept.`;
    actionBtn = (
      <Link to="/interests" style={lockedSecondaryBtn}>
        📤 View Sent Interests
      </Link>
    );
  } else if (status === "pending" && direction === "received") {
    icon = "📥";
    title = "Respond to Interest";
    message = `${partnerName} sent you an interest. Accept it to start messaging.`;
    actionBtn = (
      <Link to="/interests" style={lockedPrimaryBtn}>
        📥 Respond in Interests
      </Link>
    );
  } else if (status === "declined") {
    icon = "🚫";
    title = "Conversation Unavailable";
    message = "This connection was declined. You cannot message this user.";
    actionBtn = (
      <Link to="/search" style={lockedSecondaryBtn}>
        🔍 Find Other Matches
      </Link>
    );
  }

  return (
    <div style={wrapperStyle}>
      <div style={lockedContainerStyle}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>{icon}</div>
        <h3 style={{ margin: "0 0 12px 0", color: "#1e3a8a", fontSize: "18px" }}>
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 24px 0",
            color: "#666",
            fontSize: "14px",
            lineHeight: "1.6",
            maxWidth: "340px",
          }}
        >
          {message}
        </p>
        {actionBtn}
        <p
          style={{
            marginTop: "24px",
            fontSize: "12px",
            color: "#aaa",
            maxWidth: "340px",
          }}
        >
          🔒 For safety, Vivaha only allows messaging between users who have
          both accepted each other's interest.
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MESSAGE BUBBLE
// ============================================================
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

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ============================================================
// STYLES
// ============================================================
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

const lockedContainerStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 24px",
  textAlign: "center",
  background: "#fafafa",
};

const lockedPrimaryBtn = {
  background: "linear-gradient(135deg, #dc2626, #f97316)",
  color: "white",
  padding: "12px 24px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
  display: "inline-block",
  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.3)",
};

const lockedSecondaryBtn = {
  background: "white",
  color: "#1e3a8a",
  padding: "12px 24px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
  display: "inline-block",
  border: "1px solid #d1d5db",
};

export default ChatBox;