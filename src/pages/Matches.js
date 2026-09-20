import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "../supabaseClient";
import ChatBox from "../components/ChatBox";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

function Messages() {
  const [searchParams] = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Please log in to view messages.");
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);

        const openWith = searchParams.get("to");

        const res = await fetch(
          `${BACKEND_URL}/messages/conversations/${user.id}`
        );
        let convos = [];
        if (res.ok) {
          const data = await res.json();
          convos = data.conversations || [];
          setConversations(convos);
        }

        if (openWith) {
          const existing = convos.find((c) => c.otherUserId === openWith);
          if (existing) {
            setActiveChat(existing);
          } else {
            const profRes = await fetch(`${BACKEND_URL}/profile/${openWith}`);
            if (profRes.ok) {
              const profData = await profRes.json();
              if (profData.profile) {
                setActiveChat({
                  otherUserId: openWith,
                  name: profData.profile.name || "Anonymous",
                  photo_url: profData.profile.photo_url || null,
                  age: profData.profile.age || null,
                  location: profData.profile.location || null,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Load messages error:", err);
        setError("Could not load messages. Try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const refreshConversations = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(
        `${BACKEND_URL}/messages/conversations/${currentUserId}`
      );
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Refresh conversations error:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "18px", color: "#666" }}>
          Loading conversations... ⏳
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <p style={{ color: "#b91c1c", fontSize: "16px" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={pageContainerStyle}>
      <h2 style={pageTitleStyle}>💬 Messages</h2>

      <div style={splitLayoutStyle}>
        <div style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            Conversations ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div style={emptySidebarStyle}>
              <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
                No conversations yet.
              </p>
              <p style={{ color: "#888", fontSize: "13px", marginTop: "8px" }}>
                Start a chat from the Matches page!
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.otherUserId}
                conv={conv}
                isActive={activeChat?.otherUserId === conv.otherUserId}
                onClick={() => setActiveChat(conv)}
              />
            ))
          )}
        </div>

        <div style={chatPanelStyle}>
          {activeChat && currentUserId ? (
            <ChatBox
              userId={currentUserId}
              partnerId={activeChat.otherUserId}
              partnerName={activeChat.name}
              partnerPhoto={activeChat.photo_url}
              onMessageSent={refreshConversations}
            />
          ) : (
            <div style={emptyChatStyle}>
              <div style={{ fontSize: "60px", marginBottom: "12px" }}>💬</div>
              <p style={{ color: "#666", fontSize: "16px" }}>
                Select a conversation to start chatting
              </p>
              <p style={{ color: "#999", fontSize: "14px" }}>
                Or start a new chat from the Matches page
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ conv, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...conversationItemStyle,
        background: isActive ? "#eff6ff" : "transparent",
        borderLeft: isActive ? "4px solid #1e3a8a" : "4px solid transparent",
      }}
    >
      <div style={miniAvatarStyle}>
        {conv.photo_url ? (
          <img
            src={conv.photo_url}
            alt={conv.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          "👤"
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              fontWeight: "600",
              color: "#1e3a8a",
              fontSize: "15px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {conv.name}
          </span>
          {conv.timestamp && (
            <span style={{ fontSize: "11px", color: "#999" }}>
              {formatTime(conv.timestamp)}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#666",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {conv.lastMessage}
        </p>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHrs < 24) return `${diffHrs}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const pageContainerStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "20px",
};

const pageTitleStyle = {
  color: "#1e3a8a",
  marginTop: 0,
  marginBottom: "20px",
};

const splitLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "320px 1fr",
  gap: "0",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  overflow: "hidden",
  height: "600px",
};

const sidebarStyle = {
  borderRight: "1px solid #e5e7eb",
  overflowY: "auto",
  background: "#fafafa",
};

const sidebarHeaderStyle = {
  padding: "16px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: "600",
  color: "#1e3a8a",
  background: "white",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const emptySidebarStyle = {
  padding: "40px 20px",
  textAlign: "center",
};

const conversationItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  cursor: "pointer",
  borderBottom: "1px solid #f0f0f0",
  transition: "background 0.15s",
};

const miniAvatarStyle = {
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  overflow: "hidden",
  flexShrink: 0,
};

const chatPanelStyle = {
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "white",
};

const emptyChatStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

export default Messages; 