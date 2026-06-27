import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { requestNotificationPermission } from "./firebase";

export default function Notifications({ user, setPage }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    fetchNotifications();
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Notification.permission === "granted") {
      setPermissionGranted(true);
    }
  };

  const handleEnableNotifications = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setPermissionGranted(true);
      if (user?.id) {
        await supabase.from("users").update({ fcm_token: token }).eq("id", user.id);
      }
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
    setLoading(false);
  };

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type) => {
    switch(type) {
      case "gift": return "🎁";
      case "like": return "❤️";
      case "comment": return "💬";
      case "follow": return "👤";
      case "promo": return "📢";
      case "system": return "⚡";
      default: return "🔔";
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ background: "#111", padding: "20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#FFD700", fontSize: "22px" }}>🔔 Notifikasyon</h2>
        <button onClick={() => setPage("dashboard")}
          style={{ background: "#222", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
          ← Back
        </button>
      </div>

      {/* Pèmisyon Push */}
      {!permissionGranted && (
        <div style={{ margin: "16px", background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderRadius: "16px", padding: "20px", border: "1px solid #FFD700", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔔</div>
          <h3 style={{ color: "#FFD700", margin: "0 0 8px" }}>Aktive Notifikasyon</h3>
          <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px" }}>
            Resevwa alèt sou telefòn ou pou kado, like, ak anons EARNO!
          </p>
          <button onClick={handleEnableNotifications}
            style={{ padding: "12px 24px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", color: "#000" }}>
            Aktive Notifikasyon 🔔
          </button>
        </div>
      )}

      {permissionGranted && (
        <div style={{ margin: "16px", background: "#1a2a1a", borderRadius: "12px", padding: "12px", border: "1px solid #4CAF50", textAlign: "center" }}>
          <p style={{ color: "#4CAF50", margin: 0, fontSize: "13px" }}>✅ Notifikasyon aktive — ou pral resevwa alèt sou telefòn ou!</p>
        </div>
      )}

      {/* Lis Notifikasyon */}
      <div style={{ padding: "0 16px" }}>
        {loading ? (
          <p style={{ color: "#888", textAlign: "center", padding: "40px" }}>Ap chaje...</p>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔔</div>
            <p style={{ color: "#888" }}>Pa gen notifikasyon ankò.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} onClick={() => markAsRead(n.id)}
              style={{ background: n.read ? "#111" : "#1a1a2e", borderRadius: "14px", padding: "16px", marginBottom: "10px", border: n.read ? "1px solid #222" : "1px solid #FFD700", cursor: "pointer" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ fontSize: "28px" }}>{getIcon(n.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "700", fontSize: "14px", color: n.read ? "white" : "#FFD700" }}>{n.title}</span>
                    {!n.read && <span style={{ background: "#FFD700", borderRadius: "50%", width: "8px", height: "8px", display: "inline-block" }} />}
                  </div>
                  <p style={{ color: "#aaa", fontSize: "13px", margin: "0 0 6px" }}>{n.body}</p>
                  {n.image_url && <img src={n.image_url} alt="" style={{ width: "100%", borderRadius: "8px", marginTop: "8px" }} />}
                  <span style={{ color: "#666", fontSize: "11px" }}>{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: "#111", borderTop: "1px solid #222", display: "flex" }}>
        {[
          { label: "🏠 Home", page: "home" },
          { label: "🔍 Explore", page: "dashboard" },
          { label: "➕ Upload", page: "upload" },
          { label: "🔔 Alerts", page: "alerts" },
          { label: "👤 Profile", page: "profile" },
        ].map((item, i) => (
          <button key={i} onClick={() => setPage(item.page)}
            style={{ flex: 1, padding: "14px 0", background: "none", border: "none", color: item.page === "alerts" ? "#FFD700" : "#888", cursor: "pointer", fontSize: "11px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}