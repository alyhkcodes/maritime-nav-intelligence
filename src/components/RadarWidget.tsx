import { useRef, useEffect, useState } from 'react';

const BLIPS = [
  { angle: 45, dist: 0.35, label: 'AIS-001', type: 'vessel', speed: '18kn' },
  { angle: 120, dist: 0.6, label: 'AIS-002', type: 'vessel', speed: '14kn' },
  { angle: 200, dist: 0.45, label: 'AIS-003', type: 'vessel', speed: '21kn' },
  { angle: 310, dist: 0.7, label: 'STORM', type: 'storm', speed: 'Bf7' },
];

type Ripple = { blipIndex: number; r: number; opacity: number };

export default function RadarWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngle = useRef(0);
  const raf = useRef(0);
  const [activeBlip, setActiveBlip] = useState<number | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const SIZE = 180;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = SIZE / 2 - 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = SIZE;
    canvas.height = SIZE;

    const tick = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      // ── BACKGROUND ──
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      const bgGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
      bgGrad.addColorStop(0, 'rgba(0,30,10,0.98)');
      bgGrad.addColorStop(0.7, 'rgba(0,18,8,0.99)');
      bgGrad.addColorStop(1, 'rgba(0,10,4,1)');
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // ── PHOSPHOR RINGS ──
      [0.25, 0.5, 0.75, 1].forEach((scale, i) => {
        ctx.beginPath();
        ctx.arc(CX, CY, R * scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,255,100,${0.06 + i * 0.02})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // Range labels
        if (scale < 1) {
          ctx.fillStyle = 'rgba(0,255,100,0.25)';
          ctx.font = '7px "Share Tech Mono"';
          ctx.fillText(
            `${(scale * 100).toFixed(0)}nm`,
            CX + R * scale + 3,
            CY - 2
          );
        }
      });

      // ── CROSS HAIRS ──
      [0, 90, 45, 135].forEach((deg) => {
        const rad = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(CX + Math.cos(rad) * 4, CY + Math.sin(rad) * 4);
        ctx.lineTo(CX + Math.cos(rad) * R, CY + Math.sin(rad) * R);
        ctx.moveTo(CX - Math.cos(rad) * 4, CY - Math.sin(rad) * 4);
        ctx.lineTo(CX - Math.cos(rad) * R, CY - Math.sin(rad) * R);
        ctx.strokeStyle =
          deg % 90 === 0 ? 'rgba(0,255,100,0.12)' : 'rgba(0,255,100,0.05)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });

      // ── SWEEP (with phosphor trail) ──
      sweepAngle.current = (sweepAngle.current + 0.03) % (Math.PI * 2);
      const sa = sweepAngle.current - Math.PI / 2; // start from top

      // Trail (fading arc behind sweep)
      const trailLength = Math.PI * 0.6;
      for (let i = 0; i < 20; i++) {
        const trailAngle = sa - trailLength * (i / 20);
        const nextAngle = sa - trailLength * ((i + 1) / 20);
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.arc(CX, CY, R, trailAngle, nextAngle, true);
        ctx.closePath();
        ctx.fillStyle = `rgba(0,255,100,${0.08 * (1 - i / 20)})`;
        ctx.fill();
      }

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(CX + Math.cos(sa) * R, CY + Math.sin(sa) * R);
      const sweepGrad = ctx.createLinearGradient(
        CX,
        CY,
        CX + Math.cos(sa) * R,
        CY + Math.sin(sa) * R
      );
      sweepGrad.addColorStop(0, 'rgba(0,255,100,0)');
      sweepGrad.addColorStop(0.6, 'rgba(0,255,100,0.4)');
      sweepGrad.addColorStop(1, 'rgba(0,255,100,0.9)');
      ctx.strokeStyle = sweepGrad;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── BLIPS ──
      BLIPS.forEach((b, i) => {
        const bRad = (b.angle * Math.PI) / 180 - Math.PI / 2;
        const bx = CX + Math.cos(bRad) * R * b.dist;
        const by = CY + Math.sin(bRad) * R * b.dist;
        const color = b.type === 'storm' ? '#ff3366' : '#00ffea';

        // Check if sweep just passed this blip
        const normalizedSweep =
          (((sa + Math.PI / 2) * 180) / Math.PI + 360) % 360;
        const blipAngleDeg = b.angle;
        const diff = Math.abs(normalizedSweep - blipAngleDeg);
        if (diff < 3) {
          setRipples((prev) => [
            ...prev.slice(-8),
            { blipIndex: i, r: 4, opacity: 0.9 },
          ]);
        }

        // Core blip
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        const blipGrad = ctx.createRadialGradient(bx, by, 0, bx, by, 4);
        blipGrad.addColorStop(0, color);
        blipGrad.addColorStop(1, color + '44');
        ctx.fillStyle = blipGrad;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.strokeStyle = color + '33';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (activeBlip === i) {
          // Active highlight
          ctx.beginPath();
          ctx.arc(bx, by, 12, 0, Math.PI * 2);
          ctx.strokeStyle = color + '66';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // ── CENTER ──
      ctx.beginPath();
      ctx.arc(CX, CY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00ff88';
      ctx.fill();
      const centerGlow = ctx.createRadialGradient(CX, CY, 0, CX, CY, 10);
      centerGlow.addColorStop(0, 'rgba(0,255,136,0.4)');
      centerGlow.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(CX, CY, 10, 0, Math.PI * 2);
      ctx.fillStyle = centerGlow;
      ctx.fill();

      // ── OUTER RING ──
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,255,100,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Degree labels
      [0, 90, 180, 270].forEach((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const tx = CX + Math.cos(rad) * (R - 10);
        const ty = CY + Math.sin(rad) * (R - 10);
        ctx.fillStyle = 'rgba(0,255,100,0.4)';
        ctx.font = '7px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(['N', 'E', 'S', 'W'][deg / 90], tx, ty);
      });

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [activeBlip]);

  // Animate ripples
  useEffect(() => {
    if (ripples.length === 0) return;
    const t = setInterval(() => {
      setRipples((prev) =>
        prev
          .map((r) => ({ ...r, r: r.r + 1.5, opacity: r.opacity - 0.06 }))
          .filter((r) => r.opacity > 0)
      );
    }, 30);
    return () => clearInterval(t);
  }, [ripples.length]);

  return (
    <div className="radar-container">
      {/* Radar screen */}
      <div className="radar-screen" style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', borderRadius: '50%' }}
        />

        {/* SVG ripple overlay */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: SIZE,
            height: SIZE,
            pointerEvents: 'none',
          }}
        >
          {ripples.map((ripple, ri) => {
            const b = BLIPS[ripple.blipIndex];
            const bRad = (b.angle * Math.PI) / 180 - Math.PI / 2;
            const bx = CX + Math.cos(bRad) * (SIZE / 2 - 4) * b.dist;
            const by = CY + Math.sin(bRad) * (SIZE / 2 - 4) * b.dist;
            const color = b.type === 'storm' ? '#ff3366' : '#00ffea';
            return (
              <circle
                key={`${ri}-${ripple.r}`}
                cx={bx}
                cy={by}
                r={ripple.r}
                fill="none"
                stroke={color}
                strokeWidth="1"
                opacity={ripple.opacity}
              />
            );
          })}
        </svg>

        {/* Screen overlay: scanline */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,0.015) 2px, rgba(0,255,100,0.015) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Screen glass */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.04) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Contact list */}
      <div className="radar-contact-list">
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: 9,
            letterSpacing: '0.22em',
            color: '#00ff88',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#00ff88',
              boxShadow: '0 0 10px rgba(0,255,136,0.6)',
              animation: 'accentPulse 2s ease-in-out infinite',
            }}
          />
          RADAR — ACTIVE CONTACTS
        </div>

        {BLIPS.map((b, i) => {
          const color = b.type === 'storm' ? '#ff3366' : '#00ffea';
          const isActive = activeBlip === i;
          return (
            <div
              key={b.label}
              className="radar-contact-item"
              onMouseEnter={() => setActiveBlip(i)}
              onMouseLeave={() => setActiveBlip(null)}
              style={{
                borderLeftColor: isActive ? color : color + '44',
                background: isActive ? color + '08' : 'rgba(0,255,136,0.03)',
                transform: isActive ? 'translateX(6px)' : 'translateX(0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    animation: 'accentPulse 2s ease-in-out infinite',
                  }}
                />
                <span style={{ color, fontWeight: 600 }}>
                  {b.type === 'storm' ? '⛈' : '🚢'} {b.label}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  color: 'var(--text-dim)',
                  fontSize: 10,
                }}
              >
                <span>{b.angle}°</span>
                <span>{(b.dist * 100).toFixed(0)}nm</span>
                <span style={{ color: color + 'aa' }}>{b.speed}</span>
              </div>
            </div>
          );
        })}

        {/* Status bar */}
        <div
          style={{
            marginTop: 14,
            padding: '8px 12px',
            background: 'rgba(0,255,136,0.04)',
            border: '1px solid rgba(0,255,136,0.12)',
            borderRadius: 2,
            fontFamily: 'Share Tech Mono',
            fontSize: 10,
            color: 'rgba(0,255,136,0.6)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>RANGE: 100nm</span>
          <span>CONTACTS: {BLIPS.length}</span>
          <span
            style={{
              color: '#00ff88',
              animation: 'accentPulse 2s ease-in-out infinite',
            }}
          >
            ● LIVE
          </span>
        </div>
      </div>
    </div>
  );
}
