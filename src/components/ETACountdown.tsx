import { useEffect, useState, useRef } from 'react';

type Props = { eta: Date };

function FlipDigit({ value, color }: { value: string; color: string }) {
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setFlipping(true);
      const t = setTimeout(() => {
        setPrev(value);
        setFlipping(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [value, prev]);

  return (
    <div
      style={{
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: 38,
        color,
        textShadow: `0 0 20px ${color}88, 0 0 40px ${color}44`,
        lineHeight: 1,
        position: 'relative',
        zIndex: 1,
        transition: flipping ? 'none' : 'color 0.3s',
        transform: flipping ? 'scaleY(0.1)' : 'scaleY(1)',
        transformOrigin: 'center',
        transitionDuration: flipping ? '0.1s' : '0.15s',
        display: 'inline-block',
        letterSpacing: '-0.02em',
      }}
    >
      {flipping ? prev : value}
    </div>
  );
}

export default function ETACountdown({ eta }: Props) {
  const [now, setNow] = useState(new Date());
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = eta.getTime() - now.getTime();
  const safe = diff > 0;
  const totalSecs = Math.max(0, Math.floor(diff / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const color = safe ? '#00ffea' : '#ff3366';
  const borderColor = safe ? 'var(--neon-blue)' : 'var(--neon-red)';

  const blocks = [
    { label: 'DAYS', value: pad(days) },
    { label: 'HRS', value: pad(hours) },
    { label: 'MIN', value: pad(mins) },
    { label: 'SEC', value: pad(secs) },
  ];

  // Progress bar (percentage of voyage elapsed)
  const totalVoyageMs = eta.getTime() - (Date.now() - totalSecs * 1000);
  const elapsed = 1 - diff / (totalVoyageMs || 1);
  const progress = Math.min(Math.max(elapsed, 0), 1) * 100;

  const rowRef = useRef<HTMLDivElement>(null);
  const onMouseMove = (e: React.MouseEvent) => {
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTilt({
      x: ((e.clientY - cy) / (rect.height / 2)) * -6,
      y: ((e.clientX - cx) / (rect.width / 2)) * 6,
    });
  };

  return (
    <div>
      <div
        style={{
          fontFamily: 'Orbitron',
          fontSize: 9,
          letterSpacing: '0.22em',
          color: safe ? 'var(--neon-blue)' : 'var(--neon-red)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: safe ? 'var(--neon-blue)' : 'var(--neon-red)',
            boxShadow: `0 0 10px ${
              safe ? 'rgba(0,180,255,0.6)' : 'rgba(255,51,102,0.6)'
            }`,
            animation: 'accentPulse 2s ease-in-out infinite',
          }}
        />
        {safe ? 'TIME TO ARRIVAL' : 'ETA ELAPSED'}
      </div>

      {/* Flip blocks row */}
      <div
        ref={rowRef}
        style={{
          display: 'flex',
          gap: 10,
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.1s ease',
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      >
        {blocks.map((b, bi) => (
          <div
            key={b.label}
            className="eta-block"
            style={{
              borderTopColor: borderColor,
              transitionDelay: `${bi * 0.04}s`,
            }}
          >
            {/* Center divider line (flip clock look) */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 4,
                right: 4,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${color}22, transparent)`,
                zIndex: 2,
              }}
            />

            {/* Shadow gradient bottom half */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'linear-gradient(180deg, transparent, rgba(0,0,0,0.3))',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />

            <FlipDigit value={b.value} color={color} />
            <div className="eta-label">{b.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 16, marginBottom: 10 }}>
        <div
          style={{
            height: 3,
            background: 'rgba(0,180,255,0.08)',
            borderRadius: 2,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${
                safe ? '#00b4ff' : '#ff3366'
              }, ${safe ? '#00ffea' : '#ff6699'})`,
              borderRadius: 2,
              transition: 'width 1s ease',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: 20,
                background:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.4))',
                animation: 'barShine 2s ease infinite',
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 5,
            fontFamily: 'Share Tech Mono',
            fontSize: 9,
            color: 'var(--text-dim)',
          }}
        >
          <span>DEPARTED</span>
          <span
            style={{
              color: safe ? 'rgba(0,180,255,0.5)' : 'rgba(255,51,102,0.5)',
            }}
          >
            {progress.toFixed(0)}% ELAPSED
          </span>
          <span>ETA</span>
        </div>
      </div>

      {/* ETA readout */}
      <div
        style={{
          padding: '10px 14px',
          background: 'rgba(2,10,22,0.9)',
          border: `1px solid ${
            safe ? 'rgba(0,180,255,0.12)' : 'rgba(255,51,102,0.12)'
          }`,
          borderRadius: 3,
          fontFamily: 'Share Tech Mono',
          fontSize: 11,
          color: 'var(--text-dim)',
          textAlign: 'center',
          letterSpacing: '0.05em',
        }}
      >
        ETA:{' '}
        <span style={{ color, textShadow: `0 0 10px ${color}55` }}>
          {eta.toUTCString().toUpperCase()}
        </span>
      </div>
    </div>
  );
}
