import { useEffect, useRef } from "react";

export default function EarnoLogo({ size = 120, animated = true, showText = true, showSlogan = false }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!animated) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.02;
      const t = timeRef.current;

      const glowSize = 60 + Math.sin(t * 1.5) * 8;
      const glow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, glowSize);
      glow.addColorStop(0, `hsla(${(t * 30) % 360}, 100%, 70%, 0.15)`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.rotate(t * 0.4);
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const rx = Math.cos(angle) * 42;
        const ry = Math.sin(angle) * 42;
        const hue = (t * 40 + i * 120) % 360;
        ctx.beginPath();
        ctx.arc(rx, ry, 4 + Math.sin(t * 2 + i) * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.6)`;
        ctx.fill();
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [animated]);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        {animated && (
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ position: "absolute", top: 0, left: 0, zIndex: 0, borderRadius: "50%" }}
          />
        )}

        <div style={{
          position: "relative",
          zIndex: 1,
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <img
            src="/earno-logo.jpeg"
            alt="EARNO"
            style={{
              width: "90%",
              height: "90%",
              objectFit: "contain",
              mixBlendMode: "screen",
              animation: animated ? "earnoHolo 3s ease-in-out infinite" : "none",
              filter: animated ? "drop-shadow(0 0 16px rgba(100,200,255,0.8)) drop-shadow(0 0 32px rgba(180,100,255,0.5))" : "none",
            }}
          />
        </div>

        {animated && (
          <div style={{
            position: "absolute",
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: "50%",
            border: "2px solid transparent",
            backgroundImage: "linear-gradient(black, black), linear-gradient(135deg, #FFD700, #00FFFF, #FF00FF, #FFD700)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            animation: "earnoRing 2s linear infinite",
            zIndex: 2,
          }} />
        )}
      </div>

      {showText && (
        <div style={{
          background: "linear-gradient(135deg, #FFD700 0%, #00FFFF 40%, #FF00FF 70%, #FFD700 100%)",
          backgroundSize: "300% 300%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontWeight: "900",
          fontSize: size * 0.28,
          letterSpacing: "0.15em",
          fontFamily: "'Arial Black', sans-serif",
          animation: animated ? "earnoTextShift 4s ease infinite" : "none",
          filter: "drop-shadow(0 0 8px rgba(100,200,255,0.5))",
        }}>
          EARNO
        </div>
      )}

      {showSlogan && (
        <div style={{
          background: "linear-gradient(90deg, #FFD700, #00FFFF, #FF00FF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontSize: size * 0.08,
          letterSpacing: "0.2em",
          fontWeight: "600",
          fontFamily: "Arial, sans-serif",
          opacity: 0.85,
          textAlign: "center",
        }}>
          EARN ONCE . LIVE FOREVER.
        </div>
      )}

      <style>{`
        @keyframes earnoHolo {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(255,215,0,0.8)) hue-rotate(0deg); }
          25% { transform: scale(1.05); filter: drop-shadow(0 0 24px rgba(0,255,255,0.9)) hue-rotate(90deg); }
          50% { transform: scale(1.02); filter: drop-shadow(0 0 20px rgba(255,0,255,0.8)) hue-rotate(180deg); }
          75% { transform: scale(1.05); filter: drop-shadow(0 0 24px rgba(100,200,255,0.9)) hue-rotate(270deg); }
        }
        @keyframes earnoRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes earnoTextShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}