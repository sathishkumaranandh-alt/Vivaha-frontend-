import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { toast } from "../utils/toast";
import ReportModal from "./ReportModal";

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://vivah-2rc8.onrender.com";

const TYPING_TIMEOUT = 3000;
const POLL_INTERVAL = 5000;

function ChatBox({
  userId,
  partnerId,
  partnerName,
  partnerPhoto,
  onMessageSent,
  hideHeader = false,
  onBack,
  isMobile = false,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connStatus, setConnStatus] = useState(null);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockerId, setBlockerId] = useState(null);
  const [blockBusy, setBlockBusy] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const lastTypingSentRef = useRef(0);
  const pollRef = useRef(null);

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
          setConnStatus(data);
        } else {
          setConnStatus({ status: "none" });
        }
      } catch {
        setConnStatus({ status: "none" });
      }
    }
    if (userId && partnerId) checkConnection();
  }, [userId, partnerId]);

  // ============================================================
  // CHECK BLOCK STATUS (both directions)
  // ============================================================
  useEffect(() => {
    async function checkBlock() {
      try {
        const res = await fetch(
          `${BACKEND_URL}/blocks/any/${userId}/${partnerId}`
        );
        if (res.ok) {
          const data = await res.json();
          setIsBlocked(!!data.isBlocked);
          setBlockerId(data.blockerId || null);
        }
      } catch {}
    }
    if (userId && partnerId) checkBlock();
  }, [userId, partnerId]);

  // ============================================================
  // LOAD MESSAGES
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
          if (typeof data.partnerOnline === "boolean") {
            setPartnerOnline(data.partnerOnline);
          }
        }
      } catch (err) {
        console.error("Load chat error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, [userId, partnerId, connStatus]);

  // ============================================================
  // HEARTBEAT
  // ============================================================
  useEffect(() => {
    if (!userId || connStatus?.status !== "accepted") return;

    const sendHeartbeat = () => {
      fetch(`${BACKEND_URL}/messages/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, [userId, connStatus]);

  // ============================================================
  // POLLING — messages + typing + online
  // ============================================================
  useEffect(() => {
    if (connStatus?.status !== "accepted") return;
    if (!userId || !partnerId) return;

    fetch(`${BACKEND_URL}/messages/mark-read/${userId}/${partnerId}`, {
      method: "PATCH",
    })
      .then(() => window.dispatchEvent(new Event("badge-refresh")))
      .catch(() => {});

    fetch(`${BACKEND_URL}/notifications/read-by-actor/${userId}/${partnerId}`, {
      method: "PATCH",
    }).catch(() => {});

    const poll = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/messages/chat/${userId}/${partnerId}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          if (typeof data.partnerOnline === "boolean") {
            setPartnerOnline(data.partnerOnline);
          }
        }

        const typRes = await fetch(
          `${BACKEND_URL}/messages/typing-status/${partnerId}/${userId}`
        );
        if (typRes.ok) {
          const typData = await typRes.json();
          setPartnerTyping(!!typData.isTyping);
        }

        fetch(`${BACKEND_URL}/messages/mark-read/${userId}/${partnerId}`, {
          method: "PATCH",
        }).catch(() => {});
      } catch {}
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId, partnerId, connStatus]);

  // ============================================================
  // AUTO SCROLL
  // ============================================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  // ============================================================
  // TYPING
  // ============================================================
  const handleTyping = (value) => {
    setText(value);
    if (!value.trim()) return;
    if (connStatus?.status !== "accepted") return;

    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_TIMEOUT) {
      lastTypingSentRef.current = now;
      fetch(`${BACKEND_URL}/messages/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, typing_to: partnerId }),
      }).catch(() => {});
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      lastTypingSentRef.current = 0;
    }, TYPING_TIMEOUT);
  };

  // ============================================================
  // SEND TEXT
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
          message_type: "text",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, data.data]);
        if (onMessageSent) onMessageSent();
      } else {
        setText(msgText);
        toast.error(data.error || "Failed to send message.");
      }
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // SEND PHOTO
  // ============================================================
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only images allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `chat-${userId}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 6)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const res = await fetch(`${BACKEND_URL}/messages/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: userId,
          receiver_id: partnerId,
          text: "",
          image_url: urlData.publicUrl,
          message_type: "image",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.data]);
        if (onMessageSent) onMessageSent();
      } else {
        toast.error(data.error || "Failed to send photo");
      }
    } catch (err) {
      console.error("Photo send error:", err);
      toast.error("Photo send failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ============================================================
  // CLEAR CHAT
  // ============================================================
  const handleClearChat = async () => {
    if (!window.confirm("Clear all messages? This cannot be undone.")) return;
    try {
      const res = await fetch(
        `${BACKEND_URL}/messages/chat/${userId}/${partnerId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setMessages([]);
        setShowMenu(false);
        toast.success("Chat cleared");
      } else {
        toast.error("Failed to clear chat");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // ============================================================
  // BLOCK USER
  // ============================================================
  const handleBlock = async () => {
    setShowMenu(false);

    const confirmBlock = window.confirm(
      `Block ${partnerName}?\n\nThey won't be able to message you or see your profile. You can unblock later.`
    );
    if (!confirmBlock) return;

    setBlockBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/blocks/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocker_id: userId,
          blocked_id: partnerId,
          reason: "Blocked from chat",
        }),
      });

      if (res.ok) {
        setIsBlocked(true);
        setBlockerId(userId);
        toast.success(`${partnerName} blocked`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Block failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBlockBusy(false);
    }
  };

  // ============================================================
  // UNBLOCK USER
  // ============================================================
  const handleUnblock = async () => {
    setShowMenu(false);
    setBlockBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/blocks/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocker_id: userId,
          blocked_id: partnerId,
        }),
      });

      if (res.ok) {
        setIsBlocked(false);
        setBlockerId(null);
        toast.success(`${partnerName} unblocked`);
      } else {
        toast.error("Unblock failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setBlockBusy(false);
    }
  };

  // ============================================================
  // REPORT USER
  // ============================================================
  const handleReportClick = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  // ============================================================
  // LOADING
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
  // BLOCKED STATE — Handle both directions
  // ============================================================
  if (isBlocked) {
    const iBlockedThem = blockerId === userId;

    return (
      <div style={wrapperStyle}>
        {onBack && (
          <div
            style={{
              padding: "10px 14px",
              background: "white",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <button onClick={onBack} style={backBtnStyle} aria-label="Back">
              ←
            </button>
          </div>
        )}
        <div style={lockedContainerStyle}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>
            {iBlockedThem ? "🚫" : "🔒"}
          </div>
          <h3 style={{ margin: "0 0 12px 0", color: "#1e3a8a", fontSize: "18px" }}>
            {iBlockedThem ? "You Blocked This User" : "You've Been Blocked"}
          </h3>
          <p
            style={{
              margin: "0 0 24px 0",
              color: "#666",
              fontSize: "14px",
              lineHeight: 1.6,
              maxWidth: 340,
            }}
          >
            {iBlockedThem
              ? `You've blocked ${partnerName}. They can no longer message you or view your profile. You can unblock anytime.`
              : `${partnerName} has blocked you. You cannot send messages or view their profile.`}
          </p>

          {iBlockedThem ? (
            <button
              onClick={handleUnblock}
              disabled={blockBusy}
              style={{
                ...lockedSecondaryBtn,
                cursor: blockBusy ? "wait" : "pointer",
                opacity: blockBusy ? 0.6 : 1,
              }}
            >
              {blockBusy ? "Unblocking..." : "🔓 Unblock User"}
            </button>
          ) : (
            <Link to="/search" style={lockedPrimaryBtn}>
              🔍 Find Other Matches
            </Link>
          )}

          <p
            style={{
              marginTop: "24px",
              fontSize: "12px",
              color: "#aaa",
              maxWidth: 340,
            }}
          >
            {iBlockedThem
              ? "🔒 You can unblock this user anytime from chat menu."
              : "🔒 If you believe this was a mistake, contact support."}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // NOT CONNECTED
  // ============================================================
  if (connStatus.status !== "accepted") {
    return (
      <LockedChat
        partnerName={partnerName}
        partnerId={partnerId}
        status={connStatus.status}
        direction={connStatus.direction}
        onBack={onBack}
        isMobile={isMobile}
      />
    );
  }

  // ============================================================
  // GROUP BY DATE
  // ============================================================
  const groupedMessages = (() => {
    const groups = [];
    let lastDate = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    messages.forEach((msg) => {
      const d = new Date(msg.timestamp);
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      let label = "";
      if (day.getTime() === today.getTime()) label = "Today";
      else if (day.getTime() === yesterday.getTime()) label = "Yesterday";
      else
        label = d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

      if (label !== lastDate) {
        groups.push({ type: "separator", label });
        lastDate = label;
      }
      groups.push({ type: "message", msg });
    });
    return groups;
  })();

  return (
    <div style={wrapperStyle}>
      {!hideHeader && (
        <div style={headerStyle}>
          {onBack && (
            <button onClick={onBack} style={backBtnStyle} aria-label="Back">
              ←
            </button>
          )}

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
            {partnerOnline && <span style={headerOnlineDotStyle} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={headerNameStyle}>{partnerName}</p>
            <p style={headerStatusStyle}>
              {partnerTyping ? (
                <span style={{ color: "#16a34a", fontStyle: "italic" }}>
                  typing...
                </span>
              ) : partnerOnline ? (
                <span style={{ color: "#16a34a" }}>🟢 Online</span>
              ) : (
                <span style={{ color: "#888" }}>Offline</span>
              )}
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              style={menuBtnStyle}
              aria-label="Menu"
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <div
                  style={menuBackdropStyle}
                  onClick={() => setShowMenu(false)}
                />
                <div style={menuDropdownStyle}>
                  <button onClick={handleClearChat} style={menuItemStyle}>
                    🗑️ Clear Chat
                  </button>
                  <button onClick={handleBlock} style={menuItemStyle}>
                    🚫 Block {partnerName?.split(" ")[0] || "User"}
                  </button>
                  <button onClick={handleReportClick} style={menuItemStyle}>
                    ⚐ Report User
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div style={messagesAreaStyle}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#888" }}>
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>👋</div>
            <p style={{ color: "#888", marginBottom: "6px" }}>No messages yet</p>
            <p style={{ color: "#aaa", fontSize: "13px" }}>
              Say hi to {partnerName} to start the conversation!
            </p>
          </div>
        ) : (
          groupedMessages.map((item, idx) => {
            if (item.type === "separator") {
              return (
                <div key={`sep-${idx}`} style={dateSeparatorStyle}>
                  <span style={dateSeparatorTextStyle}>{item.label}</span>
                </div>
              );
            }
            return (
              <MessageBubble
                key={item.msg.id}
                message={item.msg}
                isOwn={item.msg.sender_id === userId}
                onImageClick={(url) => setLightboxUrl(url)}
              />
            );
          })
        )}

        {partnerTyping && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "8px",
            }}
          >
            <div style={typingBubbleStyle}>
              <span style={typingDotStyle} />
              <span style={{ ...typingDotStyle, animationDelay: "0.15s" }} />
              <span style={{ ...typingDotStyle, animationDelay: "0.3s" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form onSubmit={sendMessage} style={inputBarStyle}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={attachBtnStyle}
          aria-label="Attach"
        >
          {uploading ? "⏳" : "📎"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: "none" }}
        />
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
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
          {sending ? "..." : "➤"}
        </button>
      </form>

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl(null)} style={lightboxStyle}>
          <button
            onClick={() => setLightboxUrl(null)}
            style={lightboxCloseStyle}
            aria-label="Close"
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={lightboxImgStyle}
          />
        </div>
      )}

      {/* REPORT MODAL */}
      {showReportModal && (
        <ReportModal
          reportedUserId={partnerId}
          reportedUserName={partnerName}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// LOCKED CHAT
// ============================================================
function LockedChat({ partnerName, partnerId, status, direction, onBack }) {
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
    message = `${partnerName} hasn't accepted your interest yet.`;
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
    message = "This connection was declined.";
    actionBtn = (
      <Link to="/search" style={lockedSecondaryBtn}>
        🔍 Find Other Matches
      </Link>
    );
  }

  return (
    <div style={wrapperStyle}>
      {onBack && (
        <div
          style={{
            padding: "10px 14px",
            background: "white",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button onClick={onBack} style={backBtnStyle} aria-label="Back">
            ←
          </button>
        </div>
      )}
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
            lineHeight: 1.6,
            maxWidth: 340,
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
            maxWidth: 340,
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
function MessageBubble({ message, isOwn, onImageClick }) {
  const isImage = message.message_type === "image" || message.image_url;
  const readStatus = message.is_read ? "read" : "sent";

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
          maxWidth: "72%",
          padding: isImage ? "4px 4px 6px 4px" : "8px 12px 6px 12px",
          borderRadius: isOwn
            ? "16px 16px 4px 16px"
            : "16px 16px 16px 4px",
          background: isOwn
            ? "linear-gradient(135deg, #d1fae5, #a7f3d0)"
            : "white",
          color: "#1f2937",
          fontSize: "14px",
          lineHeight: 1.5,
          wordWrap: "break-word",
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          border: isOwn ? "1px solid #86efac" : "1px solid #e5e7eb",
        }}
      >
        {isImage && message.image_url ? (
          <div
            onClick={() => onImageClick && onImageClick(message.image_url)}
            style={{
              cursor: "pointer",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "4px",
              maxWidth: "240px",
            }}
          >
            <img
              src={message.image_url}
              alt="Attachment"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "300px",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ) : (
          <p style={{ margin: 0, padding: isImage ? "0 8px" : 0 }}>
            {message.text}
          </p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "4px",
            marginTop: "3px",
            padding: isImage ? "0 4px" : 0,
          }}
        >
          <span style={{ fontSize: "10px", color: "#6b7280", opacity: 0.85 }}>
            {formatTime(message.timestamp)}
          </span>
          {isOwn && (
            <span
              style={{
                fontSize: "11px",
                color: readStatus === "read" ? "#2563eb" : "#9ca3af",
                fontWeight: 700,
                marginLeft: "2px",
              }}
            >
              {readStatus === "read" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
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
  background: "white",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 14px",
  borderBottom: "1px solid #e5e7eb",
  background: "white",
  position: "relative",
};

const backBtnStyle = {
  background: "#f3f4f6",
  border: "none",
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  fontSize: "18px",
  cursor: "pointer",
  color: "#1e3a8a",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const headerAvatarStyle = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "#e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  overflow: "hidden",
  flexShrink: 0,
  position: "relative",
};

const headerOnlineDotStyle = {
  position: "absolute",
  bottom: "1px",
  right: "1px",
  width: "11px",
  height: "11px",
  borderRadius: "50%",
  background: "#16a34a",
  border: "2px solid white",
};

const headerNameStyle = {
  margin: 0,
  fontWeight: 700,
  color: "#1e3a8a",
  fontSize: "15px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const headerStatusStyle = {
  margin: 0,
  fontSize: "11px",
  color: "#888",
  fontWeight: 500,
};

const menuBtnStyle = {
  background: "transparent",
  border: "none",
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  fontSize: "20px",
  cursor: "pointer",
  color: "#666",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const menuBackdropStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
};

const menuDropdownStyle = {
  position: "absolute",
  top: "40px",
  right: 0,
  background: "white",
  borderRadius: "12px",
  boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
  border: "1px solid #e5e7eb",
  minWidth: "180px",
  zIndex: 100,
  overflow: "hidden",
};

const menuItemStyle = {
  display: "block",
  width: "100%",
  background: "transparent",
  border: "none",
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  color: "#374151",
  borderBottom: "1px solid #f3f4f6",
};

const messagesAreaStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "14px",
  background: "linear-gradient(180deg, #FDF2F6 0%, #FFF9F5 100%)",
};

const inputBarStyle = {
  display: "flex",
  gap: "6px",
  padding: "10px 12px",
  borderTop: "1px solid #e5e7eb",
  background: "white",
  alignItems: "center",
};

const attachBtnStyle = {
  background: "#f3f4f6",
  border: "none",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  fontSize: "18px",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const textInputStyle = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: "24px",
  border: "1.5px solid #e5e7eb",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  background: "#fafafa",
  minWidth: 0,
};

const sendButtonStyle = {
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "white",
  border: "none",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  fontWeight: "bold",
  fontSize: "16px",
  cursor: "pointer",
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const dateSeparatorStyle = {
  textAlign: "center",
  margin: "14px 0 10px 0",
};

const dateSeparatorTextStyle = {
  background: "rgba(139,10,46,0.08)",
  color: "#8a6b6b",
  fontSize: "11px",
  fontWeight: 700,
  padding: "4px 14px",
  borderRadius: "12px",
  letterSpacing: "0.3px",
};

const typingBubbleStyle = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "16px 16px 16px 4px",
  padding: "10px 14px",
  display: "flex",
  gap: "4px",
  alignItems: "center",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
};

const typingDotStyle = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  background: "#8a6b6b",
  display: "inline-block",
  animation: "typingBounce 1.2s infinite ease-in-out",
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
  background: "linear-gradient(135deg, #8B0A2E, #a01438)",
  color: "white",
  padding: "12px 24px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "14px",
  display: "inline-block",
  boxShadow: "0 4px 12px rgba(139,10,46,0.3)",
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
  cursor: "pointer",
  fontFamily: "inherit",
};

const lightboxStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.92)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const lightboxCloseStyle = {
  position: "absolute",
  top: "20px",
  right: "20px",
  background: "rgba(255,255,255,0.2)",
  color: "white",
  border: "none",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  fontSize: "20px",
  cursor: "pointer",
  fontFamily: "inherit",
};

const lightboxImgStyle = {
  maxWidth: "100%",
  maxHeight: "90vh",
  objectFit: "contain",
  borderRadius: "8px",
};

export default ChatBox;
