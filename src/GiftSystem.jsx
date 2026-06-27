import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const GIFT_TYPES = [
  { id: "rose", name: "Rose", emoji: "🌹", value: 10, price: 0.10 },
  { id: "heart", name: "Heart", emoji: "❤️", value: 50, price: 0.50 },
  { id: "star", name: "Star", emoji: "⭐", value: 100, price: 1.00 },
  { id: "diamond", name: "Diamond", emoji: "💎", value: 500, price: 5.00 },
  { id: "crown", name: "Crown", emoji: "👑", value: 1000, price: 10.00 },
  { id: "rocket", name: "Rocket", emoji: "🚀", value: 5000, price: 50.00 },
];

export default function GiftSystem({ user, targetUser, onClose }) {
  const [selectedGift, setSelectedGift] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [userPoints, setUserPoints] = useState(0);
  const [receivedGifts, setReceivedGifts] = useState([]);
  const [tab, setTab] = useState("send");

  useEffect(() => {
    fetchUserPoints();
    fetchReceivedGifts();
  }, []);

  const fetchUserPoints = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("users").select("points").eq("id", user.id).single();
    if (data) setUserPoints(data.points || 0);
  };

  const fetchReceivedGifts = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("gifts").select("*").eq("receiver_id", user.id).order("created_at", { ascending: false });
    if (data) setReceivedGifts(data);
  };

  const handleSendGift = async () => {
    if (!selectedGift) { setError("Chwazi yon kado anpremye!"); return; }
    if (!targetUser) { setError("Pa gen destinatè!"); return; }
    if (userPoints < selectedGift.value) { setError(`Ou bezwen ${selectedGift.value} pwen. Ou gen ${userPoints} sèlman.`); return; }

    setSending(true);
    setError("");

    try {
      const { error: giftError } = await supabase.from("gifts").insert([{
        sender_id: user.id,
        sender_name: user.name || "Anonymous",
        receiver_id: targetUser.id,
        receiver_name: targetUser.name,
        gift_type: selectedGift.id,
        gift_value: selectedGift.value,
        message: message,
      }]);
      if (giftError) throw giftError;

      await supabase.from("users").update({ points: userPoints - selectedGift.value }).eq("id", user.id);
      const { data: recvData } = await supabase.from("users").select("points").eq("id", targetUser.id).single();
      if (recvData) {
        await supabase.from("users").update({ points: (recvData.points || 0) + Math.floor(selectedGift.value * 0.55) }).eq("id", targetUser.id);
      }

      setSuccess(true);
      setUserPoints(prev => prev - selectedGift.value);
      setMessage("");
      setSelectedGift(null);
    } catch (err) {
      setError(err.message);
    }
    setSending(false);
  };

  const handleConvertGift = async (gift) => {
    const pointsToAdd = Math.floor(gift.gift_value * 0.55);
    await supabase.from("users").update({ points: userPoints + pointsToAdd }).eq("id", user.id);
    await supabase.from("gifts").delete().eq("id", gift.id);
    setUserPoints(prev => prev + pointsToAdd);
    setReceivedGifts(prev => prev.filter(g => g.id !== gift.id));
  };

  const giftEmoji = (type) => GIFT_TYPES.find(g => g.id === type)?.emoji || "🎁";

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#111", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "480px", maxHeight: "80vh", overflow: "auto", padding: "24px" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#FFD700" }}>🎁 Kado Vityèl</h2>
          <button onClick={onClose} style={{ background: "#222", border: "none", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>✕ Fèmen</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {["send", "received"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: "10px", background: tab === t ? "linear-gradient(135deg, #FFD700, #FFA500)" : "#222", border: "none", borderRadius: "8px", color: tab === t ? "#000" : "#888", fontWeight: "700", cursor: "pointer" }}>
              {t === "send" ? "🎁 Voye Kado" : "📬 Kado Resevwa"}
            </button>
          ))}
        </div>

        {/* Balans */}
        <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#888" }}>Balans ou:</span>
          <span style={{ color: "#FFD700", fontWeight: "700", fontSize: "18px" }}>⭐ {userPoints} pts</span>
        </div>

        {tab === "send" && (
          <div>
            {targetUser && (
              <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px", marginBottom: "16px", textAlign: "center" }}>
                <p style={{ color: "#888", margin: "0 0 4px", fontSize: "13px" }}>Voye bay:</p>
                <p style={{ color: "#FFD700", fontWeight: "700", margin: 0 }}>{targetUser.name}</p>
              </div>
            )}

            {success && (
              <div style={{ background: "#00ff0022", border: "1px solid #00ff00", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#00ff00", textAlign: "center" }}>
                🎉 Kado voye avèk siksè!
              </div>
            )}

            {error && (
              <div style={{ background: "#ff000022", border: "1px solid #ff4444", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#ff4444" }}>
                {error}
              </div>
            )}

            <h3 style={{ color: "#aaa", marginBottom: "12px", fontSize: "14px" }}>Chwazi Kado:</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
              {GIFT_TYPES.map(gift => (
                <div key={gift.id} onClick={() => { setSelectedGift(gift); setError(""); setSuccess(false); }}
                  style={{ background: selectedGift?.id === gift.id ? "#2a2a1a" : "#1a1a1a", border: selectedGift?.id === gift.id ? "2px solid #FFD700" : "1px solid #333", borderRadius: "12px", padding: "12px", textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: "28px" }}>{gift.emoji}</div>
                  <div style={{ color: "white", fontSize: "12px", fontWeight: "600", margin: "4px 0 2px" }}>{gift.name}</div>
                  <div style={{ color: "#FFD700", fontSize: "11px" }}>⭐ {gift.value}</div>
                  <div style={{ color: "#888", fontSize: "10px" }}>${gift.price.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <textarea placeholder="Mesaj (opsyonèl)..." value={message} onChange={e => setMessage(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #333", background: "#1a1a1a", color: "white", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box", height: "80px", resize: "none" }} />

            <button onClick={handleSendGift} disabled={sending || !selectedGift}
              style={{ width: "100%", padding: "14px", background: sending || !selectedGift ? "#333" : "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "16px", cursor: sending || !selectedGift ? "not-allowed" : "pointer", color: sending || !selectedGift ? "#666" : "#000" }}>
              {sending ? "Ap voye..." : selectedGift ? `Voye ${selectedGift.emoji} ${selectedGift.name} (⭐${selectedGift.value})` : "Chwazi yon kado"}
            </button>
          </div>
        )}

        {tab === "received" && (
          <div>
            {receivedGifts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px" }}>
                <div style={{ fontSize: "48px" }}>📭</div>
                <p style={{ color: "#888", marginTop: "12px" }}>Ou pako resevwa okenn kado.</p>
              </div>
            ) : (
              receivedGifts.map(gift => (
                <div key={gift.id} style={{ background: "#1a1a1a", borderRadius: "12px", padding: "16px", marginBottom: "12px", border: "1px solid #222" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "28px" }}>{giftEmoji(gift.gift_type)}</span>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "14px" }}>{gift.sender_name}</div>
                        <div style={{ color: "#FFD700", fontSize: "13px" }}>⭐ {gift.gift_value} pwen</div>
                      </div>
                    </div>
                    <button onClick={() => handleConvertGift(gift)}
                      style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "8px", padding: "8px 12px", fontWeight: "700", cursor: "pointer", color: "#000", fontSize: "12px" }}>
                      Konvèti
                    </button>
                  </div>
                  {gift.message && <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>"{gift.message}"</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}