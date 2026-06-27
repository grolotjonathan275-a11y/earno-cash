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
    const img = new Image();
    img.src = "/earno-logo.jpeg";

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      timeRef.current += 0.02;
      const t = timeRef.current;

      // Glow background
      const glowSize = w * 0.5 + Math.sin(t * 1.5) * 10;
      const glow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, glowSize);
      glow.addColorStop(0, `hsla(${(t * 40) % 360}, 100%, 60%, 0.25)`);
      glow.addColorStop(0.5, `hsla(${(t * 40 + 120) % 360}, 100%, 60%, 0.1)`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Draw logo with hue rotation
      if (img.complete) {
        ctx.save();
        ctx.translate(w/2, h/2);
        const scale = 1 + Math.sin(t * 1.2) * 0.04;
        ctx.scale(scale, scale);
        
        // Clip to remove black background
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(img, -w*0.45, -h*0.45, w*0.9, h*0.9);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      }

      // Orbiting particles
      ctx.save();
      ctx.translate(w/2, h/2);
      ctx.rotate(t * 0.5);
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const r = w * 0.4;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        const hue = (t * 50 + i * 90) % 360;
        const pSize = 3 + Math.sin(t * 3 + i) * 1.5;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 1)`;
        ctx.fill();
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    img.onload = draw;
    if (img.complete) draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [animated, size]);

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        {animated ? (
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <img
            src="/earno-logo.jpeg"
            alt="EARNO"
            style={{ width: size, height: size, objectFit: "contain", mixBlendMode: "screen" }}
          />
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
        @keyframes earnoTextShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}