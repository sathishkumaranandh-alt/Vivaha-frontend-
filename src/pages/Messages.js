import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import ChatBox from "../components/ChatBox";
import { apiFetch } from "../utils/api"; // 🛡️ Added for JWT

function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setError("Please log in to view messages.");
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);
        const openWith = searchParams.get("to");

        // 🛡️ Switched to apiFetch & removed user.id from URL
        const res = await apiFetch(`/messages/conversations`);
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
            setShowChatOnMobile(true);
          } else {
            // 🛡️ Switched to apiFetch
            const profRes = await apiFetch(`/profile/${openWith}`);
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
                setShowChatOnMobile(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshConversations = async () => {
    if (!currentUserId) return;
    try {
      // 🛡️ Switched to apiFetch & removed currentUserId from URL
      const res = await apiFetch(`/messages/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Refresh conversations error:", err);
    }
  };

  const handleSelectChat = (conv) => {
    setActiveChat(conv);
    if (isMobile) setShowChatOnMobile(true);
    // Clear ?to= param when switching manually
    if (searchParams.get("to")) {
      setSearchParams({}, { replace: true });
    }
  };

  const handleBackToList = () => {
    setShowChatOnMobile(false);
    setActiveChat(null);
    setSearchParams({}, { replace: true });
  };

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.lastMessage || "").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const groups = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };

    filteredConversations.forEach((c) => {
      if (!c.timestamp) {
        groups.Earlier.push(c);
        return;
      }
      const d = new Date(c.timestamp);
      if (d >= today) groups.Today.push(c);
      else if (d >= yesterday) groups.Yesterday.push(c);
      else if (d >= weekAgo) groups["This Week"].push(c);
      else groups.Earlier.push(c);
    });

    // Only return groups that have items
    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }, [filteredConversations]);

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ fontSize: "16px", color: "#666", marginTop: "16px" }}>
          Loading conversations...
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

  // ============================================
  // MOBILE VIEW — Show either list OR chat
  // ============================================
  if (isMobile) {
    return (
      <div style={mobileContainerStyle}>
        {!showChatOnMobile ? (
          <>
            <div style={mobileHeaderStyle}>
              <h2 style={mobileTitleStyle}>💬 Messages</h2>
            </div>

            {/* Search Bar */}
            <div style={searchWrapStyle}>
              <span style={searchIconStyle}>🔍</span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={searchInputStyle}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={searchClearStyle}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Conversations List */}
            <div style={mobileListStyle}>
              {conversations.length === 0 ? (
                <EmptyState onGoToMatches={() => navigate("/matches")} />
              ) : filteredConversations.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#888" }}>
                  No results for "{search}"
                </div>
              ) : (
                groupedConversations.map(([groupLabel, items]) => (
                  <div key={groupLabel}>
                    <div style={dateSeparatorStyle}>{groupLabel}</div>
                    {items.map((conv) => (
                      <ConversationItem
                        key={conv.otherUserId}
                        conv={conv}
                        isActive={activeChat?.otherUserId === conv.otherUserId}
                        onClick={() => handleSelectChat(conv)}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          // Mobile — Chat view
          <div style={mobileChatWrapperStyle}>
            {activeChat && currentUserId && (
              <ChatBox
                userId={currentUserId}
                partnerId={activeChat.otherUserId}
                partnerName={activeChat.name}
                partnerPhoto={activeChat.photo_url}
                onMessageSent={refreshConversations}
                onBack={handleBackToList}
                isMobile={true}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // DESKTOP VIEW — Sidebar + Chat
  // ============================================
  return (
    <div style={pageContainerStyle}>
      <h2 style={pageTitleStyle}>💬 Messages</h2>

      <div style={splitLayoutStyle}>
        {/* Sidebar */}
        <div style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span>Conversations ({conversations.length})</span>
            </div>

            {/* Search */}
            <div style={searchWrapStyle}>
              <span style={searchIconStyle}>🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...searchInputStyle, fontSize: "13px", padding: "8px 32px 8px 34px" }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={searchClearStyle} aria-label="Clear">
                  ✕
                </button>
              )}
            </div>
          </div>

          {conversations.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <p style={{ margin: 0, color: "#888", fontSize: "14px" }}>
                No conversations yet.
              </p>
              <p style={{ color: "#888", fontSize: "13px", marginTop: "8px" }}>
                Start a chat from the Matches page!
              </p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#888", fontSize: "13px" }}>
              No results for "{search}"
            </div>
          ) : (
            groupedConversations.map(([groupLabel, items]) => (
              <div key={groupLabel}>
                <div style={dateSeparatorStyle}>{groupLabel}</div>
                {items.map((conv) => (
                  <ConversationItem
                    key={conv.otherUserId}
                    conv={conv}
                    isActive={activeChat?.otherUserId === conv.otherUserId}
                    onClick={() => handleSelectChat(conv)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Chat Panel */}
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
              <p style={{ color: "#666", fontSize: "16px", margin: 0 }}>
                Select a conversation to start chatting
              </p>
              <p style={{ color: "#999", fontSize: "14px", marginTop: "8px" }}>
                Or start a new chat from the Matches page
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONVERSATION ITEM
// ============================================
function ConversationItem({ conv, isActive, onClick }) {
  const hasUnread = (conv.unreadCount || 0) > 0;
  const isOnline = conv.isOnline === true;

  return (
    <div
      onClick={onClick}
      style={{
        ...conversationItemStyle,
        background: isActive ? "#eff6ff" : "transparent",
        borderLeft: isActive ? "4px solid #1e3a8a" : "4px solid transparent",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
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
        {isOnline && <span style={onlineDotStyle} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <span
            style={{
              fontWeight: hasUnread ? "800" : "600",
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
            <span
              style={{
                fontSize: "11px",
                color: hasUnread ? "#16a34a" : "#999",
                fontWeight: hasUnread ? 700 : 400,
              }}
            >
              {formatTime(conv.timestamp)}
            </span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: hasUnread ? "#374151" : "#666",
              fontWeight: hasUnread ? 600 : 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {conv.lastMessage || "Start a conversation"}
          </p>
          {hasUnread && (
            <span style={unreadBadgeStyle}>
              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ onGoToMatches }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{ fontSize: "56px", marginBottom: "12px" }}>💬</div>
      <h3 style={{ color: "#1e3a8a", fontSize: "17px", marginBottom: "8px", marginTop: 0 }}>
        No conversations yet
      </h3>
      <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px", lineHeight: 1.5 }}>
        When you accept an interest or send one, you can start chatting here.
      </p>
      <button
        onClick={onGoToMatches}
        style={{
          background: "linear-gradient(135deg, #8B0A2E, #a01438)",
          color: "white",
          border: "none",
          padding: "12px 24px",
          borderRadius: "10px",
          fontWeight: 700,
          fontSize: "14px",
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 6px 20px rgba(139,10,46,0.3)",
        }}
      >
        💕 Go to Matches
      </button>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================
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

// ============================================
// STYLES
// ============================================
const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #f0e0e0",
  borderTop: "4px solid #8B0A2E",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

const pageContainerStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "20px",
};

const pageTitleStyle = {
  color: "#1e3a8a",
  marginTop: 0,
  marginBottom: "20px",
  fontFamily: "'Playfair Display', serif",
};

const splitLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "320px 1fr",
  gap: "0",
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  overflow: "hidden",
  height: "640px",
};

const sidebarStyle = {
  borderRight: "1px solid #e5e7eb",
  overflowY: "auto",
  background: "#fafafa",
  display: "flex",
  flexDirection: "column",
};

const sidebarHeaderStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: "600",
  color: "#1e3a8a",
  background: "white",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const searchWrapStyle = {
  position: "relative",
  marginTop: "10px",
};

const searchIconStyle = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "13px",
  opacity: 0.5,
  pointerEvents: "none",
};

const searchInputStyle = {
  width: "100%",
  padding: "10px 34px 10px 34px",
  borderRadius: "10px",
  border: "1.5px solid #e5e7eb",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  background: "#fafafa",
  boxSizing: "border-box",
  color: "#1f2937",
};

const searchClearStyle = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "#e5e7eb",
  border: "none",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  fontSize: "10px",
  cursor: "pointer",
  color: "#666",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
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
  width: "46px",
  height: "46px",
  borderRadius: "50%",
  background: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  overflow: "hidden",
  flexShrink: 0,
};

const onlineDotStyle = {
  position: "absolute",
  bottom: "1px",
  right: "1px",
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  background: "#16a34a",
  border: "2px solid white",
  boxShadow: "0 0 0 1px rgba(22,163,74,0.3)",
};

const unreadBadgeStyle = {
  background: "#16a34a",
  color: "white",
  fontSize: "10px",
  fontWeight: 800,
  padding: "2px 7px",
  borderRadius: "10px",
  minWidth: "18px",
  textAlign: "center",
  flexShrink: 0,
};

const dateSeparatorStyle = {
  padding: "8px 16px",
  fontSize: "11px",
  fontWeight: 700,
  color: "#8a6b6b",
  background: "#f3f4f6",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
  position: "sticky",
  top: 0,
  zIndex: 0,
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

// Mobile styles
const mobileContainerStyle = {
  minHeight: "100vh",
  background: "#fafafa",
  display: "flex",
  flexDirection: "column",
};

const mobileHeaderStyle = {
  padding: "16px 20px",
  background: "white",
  borderBottom: "1px solid #e5e7eb",
  position: "sticky",
  top: 0,
  zIndex: 5,
};

const mobileTitleStyle = {
  color: "#1e3a8a",
  margin: 0,
  fontSize: "20px",
  fontFamily: "'Playfair Display', serif",
};

const mobileListStyle = {
  flex: 1,
  overflowY: "auto",
  background: "white",
};

const mobileChatWrapperStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflow: "hidden",
};

export default Messages;
