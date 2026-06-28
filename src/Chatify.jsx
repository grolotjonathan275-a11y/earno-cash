import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

export default function Chatify({ user, setPage }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [view, setView] = useState("list");
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      fetchChats();
      fetchUsers();
      updateOnlineStatus(true);
    }
    return () => { if (user?.id) updateOnlineStatus(false); };
  }, [user]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      const sub = supabase.channel(`chat_${activeChat.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeChat.id}` },
          (payload) => setMessages(prev => [...prev, payload.new]))
        .subscribe();
      return () => supabase.removeChannel(sub);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateOnlineStatus = async (isOnline) => {
    await supabase.from("users").update({ is_online: isOnline, last_seen: new Date().toISOString() }).eq("id", user.id);
  };

  const fetchChats = async () => {
    const { data } = await supabase.from("chat_members").select("chat_id").eq("user_id", user.id);
    if (data && data.length > 0) {
      const chatIds = data.map(d => d.chat_id);
      const { data: chatData } = await supabase.from("chats").select("*").in("id", chatIds).order("created_at", { ascending: false });
      if (chatData) setChats(chatData);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("id, full_name, is_online").neq("id", user.id);
    if (data) setUsers(data);
  };

  const fetchMessages = async (chatId) => {
    const { data } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
    if (data) setMessages(data);
    markAsRead(chatId);
  };

  const markAsRead = async (chatId) => {
    const { data } = await supabase.from("messages").select("id, read_by").eq("chat_id", chatId).neq("sender_id", user.id);
    if (data) {
      for (const msg of data) {
        const readBy = msg.read_by ? msg.read_by.split(",") : [];
        if (!readBy.includes(user.id)) {
          readBy.push(user.id);
          await supabase.from("messages").update({ read_by: readBy.join(",") }).eq("id", msg.id);
        }
      }
    }
  };

  const startDirectChat = async (targetUser) => {
    const { data: existing } = await supabase.from("chats").select("*, chat_members!inner(user_id)").eq("type", "direct").eq("chat_members.user_id", user.id);
    const existingChat = existing?.find(c => {
      return true;
    });

    let chatId;
    if (!existingChat) {
      const { data: newChat } = await supabase.from("chats").insert([{ type: "direct", name: targetUser.full_name, created_by: user.id }]).select().single();
      chatId = newChat.id;
      await supabase.from("chat_members").insert([
        { chat_id: chatId, user_id: user.id, user_name: user.name || "Me" },
        { chat_id: chatId, user_id: targetUser.id, user_name: targetUser.full_name }
      ]);
    } else {
      chatId = existingChat.id;
    }

    const chat = { id: chatId, type: "direct", name: targetUser.full_name };
    setActiveChat(chat);
    setView("chat");
    setShowNewChat(false);
    fetchChats();
  };

  const createGroupChat = async () => {
    if (!groupName || selectedMembers.length === 0) return;
    const { data: newChat } = await supabase.from("chats").insert([{ type: "group", name: groupName, created_by: user.id }]).select().single();
    const members = [
      { chat_id: newChat.id, user_id: user.id, user_name: user.name || "Me" },
      ...selectedMembers.map(m => ({ chat_id: newChat.id, user_id: m.id, user_name: m.full_name }))
    ];
    await supabase.from("chat_members").insert(members);
    setActiveChat(newChat);
    setView("chat");
    setShowGroupModal(false);
    setGroupName("");
    setSelectedMembers([]);
    fetchChats();
  };

  const sendMessage = async (content, type = "text", mediaUrl = null) => {
    if (!content.trim() && !mediaUrl) return;
    setSending(true);
    await supabase.from("messages").insert([{
      chat_id: activeChat.id,
      sender_id: user.id,
      sender_name: user.name || user.full_name || "Me",
      content: content,
      type: type,
      media_url: mediaUrl,
      read_by: user.id,
    }]);
    setNewMessage("");
    setSending(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "earno_videos");
    const resourceType = file.type.startsWith("video") ? "video" : file.type.startsWith("audio") ? "video" : "image";
    const res = await fetch(`https://api.cloudinary.com/v1_1/pw2e2su7/${resourceType}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    const type = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "audio";
    await sendMessage(file.name, type, data.secure_url);
  };

  const deleteMessage = async (msgId, forEveryone = false) => {
    if (forEveryone) {
      await supabase.from("messages").update({ content: "🚫 Mesaj sa efase", type: "deleted" }).eq("id", msgId);
    } else {
      await supabase.from("messages").delete().eq("id", msgId).eq("sender_id", user.id);
    }
    fetchMessages(activeChat.id);
  };

  const isRead = (msg) => {
    if (!msg.read_by) return false;
    const readers = msg.read_by.split(",");
    return readers.some(id => id !== user.id);
  };

  const inputStyle = { flex: 1, padding: "12px 16px", borderRadius: "24px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "15px", outline: "none" };

  if (view === "chat" && activeChat) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0a" }}>
        {/* Chat Header */}
        <div style={{ background: "#111", padding: "16px 20px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => { setView("list"); setActiveChat(null); setMessages([]); }}
            style={{ background: "none", border: "none", color: "#FFD700", fontSize: "20px", cursor: "pointer" }}>←</button>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #FFA500)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#000", fontSize: "16px" }}>
            {activeChat.type === "group" ? "👥" : activeChat.name?.[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: "700", fontSize: "16px" }}>{activeChat.name}</div>
            <div style={{ color: "#4CAF50", fontSize: "12px" }}>
              {activeChat.type === "group" ? "Gwoup" : "🟢 Anliy"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button style={{ background: "none", border: "none", color: "#FFD700", fontSize: "20px", cursor: "pointer" }}>📞</button>
            <button style={{ background: "none", border: "none", color: "#FFD700", fontSize: "20px", cursor: "pointer" }}>📹</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>💬</div>
              <p>Kòmanse konvèsasyon an!</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: "8px", alignItems: "flex-end" }}>
                {!isMe && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #FFA500)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#000", flexShrink: 0 }}>
                    {msg.sender_name?.[0]}
                  </div>
                )}
                <div style={{ maxWidth: "75%" }}>
                  {!isMe && <div style={{ color: "#FFD700", fontSize: "11px", marginBottom: "4px", fontWeight: "600" }}>{msg.sender_name}</div>}
                  <div style={{
                    background: isMe ? "linear-gradient(135deg, #FFD700, #FFA500)" : "#1a1a1a",
                    color: isMe ? "#000" : "white",
                    padding: msg.type === "image" || msg.type === "video" ? "4px" : "10px 14px",
                    borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    fontSize: "15px",
                    border: isMe ? "none" : "1px solid #333",
                    position: "relative",
                  }}
                    onDoubleClick={() => {
                      if (isMe && confirm("Efase mesaj sa?")) {
                        const forAll = confirm("Efase pou tout moun?");
                        deleteMessage(msg.id, forAll);
                      }
                    }}>
                    {msg.type === "image" && <img src={msg.media_url} alt="" style={{ maxWidth: "200px", borderRadius: "14px", display: "block" }} />}
                    {msg.type === "video" && <video src={msg.media_url} controls style={{ maxWidth: "200px", borderRadius: "14px", display: "block" }} />}
                    {msg.type === "audio" && <audio src={msg.media_url} controls style={{ maxWidth: "200px" }} />}
                    {(msg.type === "text" || msg.type === "deleted" || !msg.type) && <span>{msg.content}</span>}
                  </div>
                  <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: "4px", marginTop: "2px" }}>
                    <span style={{ color: "#888", fontSize: "10px" }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isMe && <span style={{ fontSize: "10px", color: isRead(msg) ? "#4FC3F7" : "#888" }}>{isRead(msg) ? "✓✓" : "✓"}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ background: "#111", padding: "12px 16px", borderTop: "1px solid #222", display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ background: "none", border: "none", color: "#FFD700", fontSize: "22px", cursor: "pointer" }}>📎</button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" style={{ display: "none" }} onChange={handleFileUpload} />
          <input style={inputStyle} placeholder="Ekri yon mesaj..." value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(newMessage)} />
          <button onClick={() => sendMessage(newMessage)} disabled={sending || !newMessage.trim()}
            style={{ background: newMessage.trim() ? "linear-gradient(135deg, #FFD700, #FFA500)" : "#333", border: "none", borderRadius: "50%", width: "44px", height: "44px", cursor: newMessage.trim() ? "pointer" : "not-allowed", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {sending ? "⏳" : "➤"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ background: "#111", padding: "20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#FFD700", fontSize: "22px" }}>💬 Chatify</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowGroupModal(true)}
            style={{ background: "#1a1a1a", border: "1px solid #333", color: "#FFD700", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "13px" }}>
            👥 Gwoup
          </button>
          <button onClick={() => setShowNewChat(true)}
            style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", color: "#000", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
            ✏️ Nouvo
          </button>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#111", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "480px", padding: "24px", maxHeight: "70vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#FFD700" }}>Chwazi Moun</h3>
              <button onClick={() => setShowNewChat(false)} style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            {users.map(u => (
              <div key={u.id} onClick={() => startDirectChat(u)}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", cursor: "pointer", marginBottom: "8px", background: "#1a1a1a", border: "1px solid #222" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #FFA500)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#000", fontSize: "18px", position: "relative" }}>
                  {u.full_name?.[0]}
                  {u.is_online && <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", borderRadius: "50%", background: "#4CAF50", border: "2px solid #111" }} />}
                </div>
                <div>
                  <div style={{ fontWeight: "600" }}>{u.full_name}</div>
                  <div style={{ color: u.is_online ? "#4CAF50" : "#888", fontSize: "12px" }}>{u.is_online ? "🟢 Anliy" : "⚫ Offline"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#111", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "480px", padding: "24px", maxHeight: "70vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#FFD700" }}>👥 Nouvo Gwoup</h3>
              <button onClick={() => setShowGroupModal(false)} style={{ background: "none", border: "none", color: "#888", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <input placeholder="Non Gwoup la..." value={groupName} onChange={e => setGroupName(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "15px", marginBottom: "16px", boxSizing: "border-box" }} />
            <p style={{ color: "#888", fontSize: "13px", marginBottom: "12px" }}>Chwazi manm yo:</p>
            {users.map(u => (
              <div key={u.id} onClick={() => setSelectedMembers(prev => prev.find(m => m.id === u.id) ? prev.filter(m => m.id !== u.id) : [...prev, u])}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "10px", cursor: "pointer", marginBottom: "6px", background: selectedMembers.find(m => m.id === u.id) ? "#2a2a1a" : "#1a1a1a", border: selectedMembers.find(m => m.id === u.id) ? "1px solid #FFD700" : "1px solid #222" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: selectedMembers.find(m => m.id === u.id) ? "#FFD700" : "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                  {selectedMembers.find(m => m.id === u.id) ? "✓" : ""}
                </div>
                <span>{u.full_name}</span>
              </div>
            ))}
            <button onClick={createGroupChat} disabled={!groupName || selectedMembers.length === 0}
              style={{ width: "100%", padding: "14px", background: groupName && selectedMembers.length > 0 ? "linear-gradient(135deg, #FFD700, #FFA500)" : "#333", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", color: groupName && selectedMembers.length > 0 ? "#000" : "#666", marginTop: "16px" }}>
              Kreye Gwoup ({selectedMembers.length} manm)
            </button>
          </div>
        </div>
      )}

      {/* Chat List */}
      <div style={{ padding: "16px" }}>
        {chats.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>💬</div>
            <h3 style={{ color: "#FFD700", marginBottom: "8px" }}>Chatify</h3>
            <p style={{ color: "#888", marginBottom: "24px" }}>Kòmanse yon konvèsasyon ak nenpòt manm EARNO!</p>
            <button onClick={() => setShowNewChat(true)}
              style={{ padding: "14px 28px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "50px", fontWeight: "700", cursor: "pointer", color: "#000", fontSize: "16px" }}>
              ✏️ Kòmanse Chat
            </button>
          </div>
        ) : (
          chats.map(chat => (
            <div key={chat.id} onClick={() => { setActiveChat(chat); setView("chat"); }}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", borderRadius: "14px", cursor: "pointer", marginBottom: "8px", background: "#111", border: "1px solid #222" }}>
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #FFA500)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#000", fontSize: "20px", flexShrink: 0 }}>
                {chat.type === "group" ? "👥" : chat.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", fontSize: "15px" }}>{chat.name}</div>
                <div style={{ color: "#888", fontSize: "13px" }}>{chat.type === "group" ? "Gwoup chat" : "Mesaj dirèk"}</div>
              </div>
              <div style={{ color: "#888", fontSize: "11px" }}>{new Date(chat.created_at).toLocaleDateString()}</div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: "#111", borderTop: "1px solid #222", display: "flex" }}>
        {[
          { label: "🏠 Home", page: "home" },
          { label: "📱 Feed", page: "dashboard" },
          { label: "💬 Chat", page: "chatify" },
          { label: "🤝 Refer", page: "referral" },
          { label: "👤 Profile", page: "profile" },
        ].map((item, i) => (
          <button key={i} onClick={() => setPage(item.page)}
            style={{ flex: 1, padding: "14px 0", background: "none", border: "none", color: item.page === "chatify" ? "#FFD700" : "#888", cursor: "pointer", fontSize: "11px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}