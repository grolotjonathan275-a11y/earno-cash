import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const generateCode = (name) => {
  const base = name?.replace(/\s+/g, "").toUpperCase().slice(0, 4) || "EARN";
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${rand}`;
};

export default function Referral({ user, setPage }) {
  const [referralCode, setReferralCode] = useState("");
  const [referredUsers, setReferredUsers] = useState([]);
  const [totalBonus, setTotalBonus] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      initReferral();
      fetchReferredUsers();
    }
  }, [user]);

  const initReferral = async () => {
    const { data } = await supabase.from("users").select("referral_code").eq("id", user.id).single();
    if (data?.referral_code) {
      setReferralCode(data.referral_code);
    } else {
      const code = generateCode(user.name);
      await supabase.from("users").update({ referral_code: code }).eq("id", user.id);
      setReferralCode(code);
    }
    setLoading(false);
  };

  const fetchReferredUsers = async () => {
    const { data } = await supabase.from("users").select("full_name, created_at, points").eq("referred_by", user.id);
    if (data) {
      setReferredUsers(data);
      setTotalBonus(data.length * 50);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const msg = `🚀 Jwenn EARNO — platfòm kote ou touche lajan pou gade videyo, voye kado, ak plis!\n\nItilize kòd referral mwen: ${referralCode}\n\n👉 earno-cash.vercel.app`;
    if (navigator.share) {
      navigator.share({ title: "EARNO", text: msg, url: "https://earno-cash.vercel.app" });
    } else {
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "80px" }}>
      {/* Header */}
      <div style={{ background: "#111", padding: "20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#FFD700", fontSize: "22px" }}>🤝 Referral</h2>
        <button onClick={() => setPage("dashboard")}
          style={{ background: "#222", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
          ← Back
        </button>
      </div>

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", margin: "16px", borderRadius: "20px", padding: "24px", textAlign: "center", border: "1px solid #FFD700" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚀</div>
        <h3 style={{ color: "#FFD700", margin: "0 0 8px", fontSize: "20px" }}>Envite Zanmi — Touche Pwen!</h3>
        <p style={{ color: "#aaa", margin: "0 0 4px", fontSize: "14px" }}>Chak zanmi ou envite = <span style={{ color: "#FFD700", fontWeight: "700" }}>+50 pwen</span> pou ou</p>
        <p style={{ color: "#aaa", margin: 0, fontSize: "14px" }}>Zanmi ou a resevwa tou = <span style={{ color: "#4CAF50", fontWeight: "700" }}>+25 pwen</span> bonjan</p>
      </div>

      {/* Kòd Referral */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ background: "#111", borderRadius: "16px", padding: "20px", border: "1px solid #222" }}>
          <p style={{ color: "#888", fontSize: "13px", margin: "0 0 12px" }}>Kòd Referral Pèsonèl Ou:</p>
          {loading ? (
            <p style={{ color: "#888" }}>Ap chaje...</p>
          ) : (
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ flex: 1, background: "#0a0a0a", borderRadius: "12px", padding: "16px", textAlign: "center", border: "2px solid #FFD700" }}>
                <span style={{ color: "#FFD700", fontWeight: "900", fontSize: "28px", letterSpacing: "0.2em" }}>{referralCode}</span>
              </div>
              <button onClick={handleCopy}
                style={{ padding: "16px", background: copied ? "#4CAF50" : "#222", border: "1px solid #333", borderRadius: "12px", color: "white", cursor: "pointer", fontSize: "20px" }}>
                {copied ? "✓" : "📋"}
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleCopy}
              style={{ flex: 1, padding: "12px", background: "#222", border: "1px solid #333", borderRadius: "10px", color: "white", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}>
              {copied ? "✅ Kopye!" : "📋 Kopye Kòd"}
            </button>
            <button onClick={handleShare}
              style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", color: "#000", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>
              📤 Pataje
            </button>
          </div>
        </div>
      </div>

      {/* Statistik */}
      <div style={{ padding: "0 16px 16px", display: "flex", gap: "12px" }}>
        {[
          { label: "Zanmi Envite", value: referredUsers.length, icon: "👥" },
          { label: "Pwen Touche", value: totalBonus, icon: "⭐" },
          { label: "Valè Dola", value: `$${(totalBonus / 100).toFixed(2)}`, icon: "💰" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
            <div style={{ fontSize: "24px" }}>{s.icon}</div>
            <div style={{ color: "#FFD700", fontWeight: "900", fontSize: "20px", margin: "6px 0 4px" }}>{s.value}</div>
            <div style={{ color: "#888", fontSize: "11px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Lis Zanmi */}
      <div style={{ padding: "0 16px" }}>
        <h3 style={{ color: "#FFD700", marginBottom: "12px" }}>👥 Zanmi ou Envite ({referredUsers.length})</h3>
        {referredUsers.length === 0 ? (
          <div style={{ background: "#111", borderRadius: "16px", padding: "30px", textAlign: "center", border: "1px solid #222" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👥</div>
            <p style={{ color: "#888", margin: "0 0 16px" }}>Ou pako envite okenn zanmi ankò.</p>
            <button onClick={handleShare}
              style={{ padding: "12px 24px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", color: "#000" }}>
              📤 Kòmanse Envite!
            </button>
          </div>
        ) : (
          referredUsers.map((u, i) => (
            <div key={i} style={{ background: "#111", borderRadius: "12px", padding: "16px", marginBottom: "10px", border: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #FFD700, #FFA500)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#000" }}>
                  {u.full_name?.[0] || "?"}
                </div>
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{u.full_name}</div>
                  <div style={{ color: "#888", fontSize: "12px" }}>{new Date(u.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <span style={{ color: "#4CAF50", fontWeight: "700" }}>+50 pts</span>
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
            style={{ flex: 1, padding: "14px 0", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "11px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}