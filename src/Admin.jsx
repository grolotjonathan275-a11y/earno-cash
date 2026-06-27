import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const ADMIN_PASSWORD = "earno2024admin";

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, totalPoints: 0 });
  const [activeTab, setActiveTab] = useState("users");
  const [rules, setRules] = useState([
    { id: 1, name: "Points pou watch video", value: "10 pts / 60 sek" },
    { id: 2, name: "Points pou 100 abòne", value: "10 pts" },
    { id: 3, name: "Frè payout platfòm", value: "45%" },
    { id: 4, name: "Minimum payout", value: "1000 pts ($10)" },
    { id: 5, name: "Points bonjan enskripyon", value: "5 pts" },
  ]);
  const [newRule, setNewRule] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    if (!error && data) {
      setUsers(data);
      setStats({
        total: data.length,
        totalPoints: data.reduce((sum, u) => sum + (u.points || 0), 0),
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (auth) fetchUsers();
  }, [auth]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuth(true);
      setError("");
    } else {
      setError("❌ Modpas enkòrèk!");
    }
  };

  const handleDeleteUser = async (id) => {
    if (confirm("Ou sèten ou vle efase itilizatè sa a?")) {
      await supabase.from("users").delete().eq("id", id);
      fetchUsers();
    }
  };

  const handleAiRule = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setTimeout(() => {
      setRules(prev => [...prev, { id: Date.now(), name: aiPrompt, value: "Aktif" }]);
      setAiPrompt("");
      setAiLoading(false);
    }, 1500);
  };

  const inputStyle = {
    width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #333",
    background: "#1a1a1a", color: "white", fontSize: "15px", marginBottom: "12px", boxSizing: "border-box"
  };

  if (!auth) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#111", border: "1px solid #FFD700", borderRadius: "20px", padding: "40px", width: "360px", textAlign: "center" }}>
          <h1 style={{ color: "#FFD700", marginBottom: "8px" }}>🔒 EARNO</h1>
          <p style={{ color: "#888", marginBottom: "24px" }}>Admin Dashboard</p>
          <input type="password" placeholder="Modpas Admin" style={inputStyle} value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />
          {error && <p style={{ color: "#ff4444", marginBottom: "12px" }}>{error}</p>}
          <button onClick={handleLogin}
            style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "16px", cursor: "pointer", color: "#000" }}>
            Antre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "white", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#111", borderBottom: "1px solid #222", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#FFD700" }}>⚡ EARNO Admin</h2>
        <button onClick={() => setAuth(false)}
          style={{ background: "#222", border: "1px solid #333", color: "#888", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
          Dekonekte
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", padding: "24px", flexWrap: "wrap" }}>
        {[
          { label: "Total Itilizatè", value: stats.total, icon: "👥" },
          { label: "Total Pwen", value: stats.totalPoints, icon: "⭐" },
          { label: "Revni Platfòm (45%)", value: `$${((stats.totalPoints / 100) * 0.45).toFixed(2)}`, icon: "💰" },
          { label: "Règ Aktif", value: rules.length, icon: "⚙️" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#111", border: "1px solid #222", borderRadius: "16px", padding: "20px", flex: "1", minWidth: "180px", textAlign: "center" }}>
            <div style={{ fontSize: "32px" }}>{s.icon}</div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "#FFD700", margin: "8px 0 4px" }}>{s.value}</div>
            <div style={{ color: "#888", fontSize: "13px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #222", padding: "0 24px" }}>
        {["users", "rules", "ai"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: "12px 20px", background: "none", border: "none", color: activeTab === tab ? "#FFD700" : "#888", borderBottom: activeTab === tab ? "2px solid #FFD700" : "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", textTransform: "capitalize" }}>
            {tab === "users" ? "👥 Itilizatè" : tab === "rules" ? "⚙️ Règ" : "🤖 AI Règ"}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px" }}>
        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#FFD700" }}>👥 Tout Itilizatè yo</h3>
              <button onClick={fetchUsers} style={{ background: "#222", border: "1px solid #333", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>
                🔄 Rafraichi
              </button>
            </div>
            {loading ? (
              <p style={{ color: "#888", textAlign: "center" }}>Ap chaje...</p>
            ) : users.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center" }}>Pa gen itilizatè ankò.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #333" }}>
                      {["Non", "Email", "Peyi", "Pwen", "Kat", "Date", "Aksyon"].map(h => (
                        <th key={h} style={{ padding: "12px", textAlign: "left", color: "#FFD700" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <td style={{ padding: "12px" }}>{u.full_name}</td>
                        <td style={{ padding: "12px", color: "#888" }}>{u.email}</td>
                        <td style={{ padding: "12px" }}>{u.country}</td>
                        <td style={{ padding: "12px", color: "#FFD700", fontWeight: "700" }}>{u.points}</td>
                        <td style={{ padding: "12px", color: "#888" }}>****{u.card_number?.slice(-4)}</td>
                        <td style={{ padding: "12px", color: "#888", fontSize: "12px" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "12px" }}>
                          <button onClick={() => handleDeleteUser(u.id)}
                            style={{ background: "#ff444422", border: "1px solid #ff4444", color: "#ff4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                            Efase
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === "rules" && (
          <div>
            <h3 style={{ color: "#FFD700", marginBottom: "16px" }}>⚙️ Règ Sistèm</h3>
            {rules.map(r => (
              <div key={r.id} style={{ background: "#111", border: "1px solid #222", borderRadius: "12px", padding: "16px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>{r.name}</div>
                  <div style={{ color: "#FFD700", fontSize: "14px" }}>{r.value}</div>
                </div>
                <button onClick={() => setRules(prev => prev.filter(x => x.id !== r.id))}
                  style={{ background: "#ff444422", border: "1px solid #ff4444", color: "#ff4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                  Retire
                </button>
              </div>
            ))}
            <div style={{ marginTop: "20px" }}>
              <input placeholder="Ajoute nouvo règ manyèlman..." style={inputStyle} value={newRule} onChange={e => setNewRule(e.target.value)} />
              <button onClick={() => { if (newRule) { setRules(prev => [...prev, { id: Date.now(), name: newRule, value: "Aktif" }]); setNewRule(""); } }}
                style={{ padding: "12px 24px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", color: "#000" }}>
                Ajoute Règ
              </button>
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === "ai" && (
          <div>
            <h3 style={{ color: "#FFD700", marginBottom: "8px" }}>🤖 Ajoute Règ ak AI</h3>
            <p style={{ color: "#888", marginBottom: "20px" }}>Ekri sa ou vle chanje — AI ap kreye règ la pou ou.</p>
            <textarea placeholder="Ekzanp: Chak 50 like sou yon video, kreyatè a jwenn 5 pwen siplemantè..." 
              style={{ ...inputStyle, height: "120px", resize: "vertical" }}
              value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
            <button onClick={handleAiRule} disabled={aiLoading}
              style={{ padding: "14px 28px", background: aiLoading ? "#333" : "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", color: aiLoading ? "#666" : "#000", fontSize: "15px" }}>
              {aiLoading ? "AI ap travay..." : "🤖 Kreye Règ ak AI"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}