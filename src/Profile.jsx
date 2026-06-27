import { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function Profile({ user, setPage }) {
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: "", country: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ totalVideos: 0, totalLikes: 0, totalPoints: 0 });

  useEffect(() => {
    fetchProfile();
    fetchUserVideos();
  }, []);

  const fetchProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (data) {
      setProfile(data);
      setForm({ full_name: data.full_name, country: data.country, address: data.address });
      setStats(prev => ({ ...prev, totalPoints: data.points || 0 }));
    }
    setLoading(false);
  };

  const fetchUserVideos = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("videos").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setVideos(data);
      setStats(prev => ({
        ...prev,
        totalVideos: data.length,
        totalLikes: data.reduce((sum, v) => sum + (v.likes || 0), 0)
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("users").update({ full_name: form.full_name, country: form.country, address: form.address }).eq("id", user.id);
    setProfile(prev => ({ ...prev, ...form }));
    setEditing(false);
    setSaving(false);
  };

  const inputStyle = {
    width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #333",
    background: "#1a1a1a", color: "white", fontSize: "15px", marginBottom: "12px", boxSizing: "border-box"
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#888" }}>Ap chaje pwofil...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ background: "#111", padding: "20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#FFD700", fontSize: "22px" }}>👤 Profile</h2>
        <button onClick={() => setPage("dashboard")}
          style={{ background: "#222", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
          ← Back
        </button>
      </div>

      {/* Avatar + Non */}
      <div style={{ textAlign: "center", padding: "30px 20px 20px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #FFA500)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "36px", fontWeight: "900", color: "#000" }}>
          {profile?.full_name?.[0]?.toUpperCase() || "?"}
        </div>
        <h2 style={{ margin: "0 0 4px", color: "white", fontSize: "22px" }}>{profile?.full_name}</h2>
        <p style={{ color: "#888", margin: "0 0 4px", fontSize: "14px" }}>📍 {profile?.country}</p>
        <p style={{ color: "#888", margin: 0, fontSize: "13px" }}>{profile?.email}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", padding: "0 20px 20px" }}>
        {[
          { label: "Videyo", value: stats.totalVideos, icon: "🎬" },
          { label: "Pwen", value: stats.totalPoints, icon: "⭐" },
          { label: "Balans", value: `$${((stats.totalPoints || 0) / 100).toFixed(2)}`, icon: "💰" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "24px" }}>{s.icon}</div>
            <div style={{ color: "#FFD700", fontWeight: "900", fontSize: "20px", margin: "6px 0 4px" }}>{s.value}</div>
            <div style={{ color: "#888", fontSize: "12px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit Profil */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ background: "#111", border: "1px solid #222", borderRadius: "16px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#FFD700" }}>✏️ Enfòmasyon</h3>
            <button onClick={() => setEditing(!editing)}
              style={{ background: editing ? "#333" : "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", color: editing ? "white" : "#000", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>
              {editing ? "Anile" : "Modifye"}
            </button>
          </div>

          {editing ? (
            <div>
              <input placeholder="Non Konplè" style={inputStyle} value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
              <input placeholder="Peyi" style={inputStyle} value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
              <input placeholder="Adrès" style={inputStyle} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              <button onClick={handleSave} disabled={saving}
                style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", color: "#000" }}>
                {saving ? "Ap sove..." : "💾 Sove Chanjman"}
              </button>
            </div>
          ) : (
            <div>
              {[
                { label: "Non", value: profile?.full_name },
                { label: "Email", value: profile?.email },
                { label: "Peyi", value: profile?.country },
                { label: "Adrès", value: profile?.address },
                { label: "Kat", value: profile?.card_number ? `****${profile.card_number.slice(-4)}` : "Pa mete" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ color: "#888", fontSize: "14px" }}>{item.label}</span>
                  <span style={{ color: "white", fontSize: "14px", fontWeight: "600" }}>{item.value || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Videyo Itilizatè */}
      <div style={{ padding: "0 20px" }}>
        <h3 style={{ color: "#FFD700", marginBottom: "16px" }}>🎬 Videyo Mwen ({videos.length})</h3>
        {videos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", background: "#111", borderRadius: "16px", border: "1px solid #222" }}>
            <p style={{ color: "#888" }}>Ou poko poste okenn videyo.</p>
            <button onClick={() => setPage("upload")}
              style={{ padding: "10px 20px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", color: "#000", marginTop: "10px" }}>
              Poste Premye Video!
            </button>
          </div>
        ) : (
          videos.map(v => (
            <div key={v.id} style={{ background: "#111", borderRadius: "12px", padding: "16px", marginBottom: "12px", border: "1px solid #222" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <video src={v.video_url} style={{ width: "80px", height: "60px", borderRadius: "8px", objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px", fontWeight: "700", fontSize: "14px" }}>{v.title}</p>
                  <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>{new Date(v.created_at).toLocaleDateString()}</p>
                  <p style={{ margin: "4px 0 0", color: "#FFD700", fontSize: "12px" }}>❤️ {v.likes || 0} likes · 👁️ {v.views || 0} views</p>
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
            style={{ flex: 1, padding: "14px 0", background: "none", border: "none", color: item.page === "profile" ? "#FFD700" : "#888", cursor: "pointer", fontSize: "11px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}