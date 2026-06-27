import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase, PAYPAL_CLIENT_ID } from "./supabase";

const POINT_PACKAGES = [
  { id: 1, points: 100, price: "1.00", label: "Starter", emoji: "⭐", bonus: 0 },
  { id: 2, points: 500, price: "4.50", label: "Popular", emoji: "🔥", bonus: 50 },
  { id: 3, points: 1000, price: "8.00", label: "Pro", emoji: "💎", bonus: 200 },
  { id: 4, points: 5000, price: "35.00", label: "Elite", emoji: "👑", bonus: 1000 },
  { id: 5, points: 10000, price: "60.00", label: "Legend", emoji: "🚀", bonus: 3000 },
];

export default function PaymentSystem({ user, onClose, onSuccess }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      const totalPoints = selectedPackage.points + selectedPackage.bonus;

      const { data: userData } = await supabase
        .from("users")
        .select("points")
        .eq("id", user.id)
        .single();

      await supabase
        .from("users")
        .update({ points: (userData?.points || 0) + totalPoints })
        .eq("id", user.id);

      setSuccess(true);
      if (onSuccess) onSuccess(totalPoints);
    } catch (err) {
      setError("Erè pandan peman an. Eseye ankò.");
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "#111", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "480px", maxHeight: "85vh", overflow: "auto", padding: "24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, color: "#FFD700" }}>💳 Achte Pwen</h2>
          <button onClick={onClose} style={{ background: "#222", border: "none", color: "white", padding: "8px 16px", borderRadius: "8px", cursor: "pointer" }}>✕</button>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ color: "#FFD700", marginBottom: "8px" }}>Peman Reyisi!</h2>
            <p style={{ color: "#aaa", marginBottom: "24px" }}>
              +{(selectedPackage?.points || 0) + (selectedPackage?.bonus || 0)} pwen ajoute nan kont ou!
            </p>
            <button onClick={onClose}
              style={{ padding: "14px 28px", background: "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", color: "#000", fontSize: "16px" }}>
              Kontinye Earno! 🚀
            </button>
          </div>
        ) : (
          <div>
            {error && (
              <div style={{ background: "#ff000022", border: "1px solid #ff4444", borderRadius: "10px", padding: "12px", marginBottom: "16px", color: "#ff4444" }}>
                {error}
              </div>
            )}

            <p style={{ color: "#888", marginBottom: "16px", fontSize: "14px" }}>
              Chwazi yon pakè pwen pou kontinye aktif sou EARNO:
            </p>

            {/* Pakèt yo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {POINT_PACKAGES.map(pkg => (
                <div key={pkg.id} onClick={() => { setSelectedPackage(pkg); setError(""); }}
                  style={{ background: selectedPackage?.id === pkg.id ? "#2a2a1a" : "#1a1a1a", border: selectedPackage?.id === pkg.id ? "2px solid #FFD700" : "1px solid #333", borderRadius: "14px", padding: "16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "28px" }}>{pkg.emoji}</span>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "15px" }}>{pkg.label}</div>
                      <div style={{ color: "#FFD700", fontSize: "13px" }}>
                        ⭐ {pkg.points} pwen
                        {pkg.bonus > 0 && <span style={{ color: "#4CAF50", marginLeft: "6px" }}>+{pkg.bonus} BONUS</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "white", fontWeight: "900", fontSize: "18px" }}>${pkg.price}</div>
                    <div style={{ color: "#888", fontSize: "11px" }}>USD</div>
                  </div>
                </div>
              ))}
            </div>

            {/* PayPal Bouton */}
            {selectedPackage ? (
              <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "USD" }}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "14px", marginBottom: "12px", textAlign: "center" }}>
                    <p style={{ color: "#aaa", margin: "0 0 4px", fontSize: "13px" }}>Ou chwazi:</p>
                    <p style={{ color: "#FFD700", fontWeight: "700", margin: 0, fontSize: "16px" }}>
                      {selectedPackage.emoji} {selectedPackage.label} — ${selectedPackage.price}
                    </p>
                    <p style={{ color: "#4CAF50", margin: "4px 0 0", fontSize: "13px" }}>
                      Total: {selectedPackage.points + selectedPackage.bonus} pwen
                    </p>
                  </div>
                  <PayPalButtons
                    style={{ layout: "vertical", color: "gold", shape: "pill", label: "pay" }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        purchase_units: [{
                          amount: { value: selectedPackage.price },
                          description: `EARNO ${selectedPackage.label} - ${selectedPackage.points} points`
                        }]
                      });
                    }}
                    onApprove={handleApprove}
                    onError={() => setError("Erè PayPal. Verifye koneksyon ou epi eseye ankò.")}
                    onCancel={() => setError("Peman anile.")}
                  />
                </div>
              </PayPalScriptProvider>
            ) : (
              <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                <p style={{ color: "#888" }}>👆 Chwazi yon pakè anwo pou wè bouton peman an</p>
              </div>
            )}

            <p style={{ color: "#888", fontSize: "11px", textAlign: "center", marginTop: "12px" }}>
              🔒 Peman sekirize pa PayPal — Visa, Mastercard, Amex aksepte
            </p>
          </div>
        )}
      </div>
    </div>
  );
}