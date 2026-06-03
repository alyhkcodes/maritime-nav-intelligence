import { useRef, useState, ReactNode } from 'react';

type Accent = 'blue' | 'cyan' | 'green' | 'amber' | 'red';

const ACCENT_MAP: Record<
  Accent,
  { dot: string; title: string; line: string; glow: string }
> = {
  blue: {
    dot: '#00b4ff',
    title: '#00b4ff',
    line: '#00b4ff',
    glow: 'rgba(0,180,255,0.3)',
  },
  cyan: {
    dot: '#00ffea',
    title: '#00ffea',
    line: '#00ffea',
    glow: 'rgba(0,255,234,0.3)',
  },
  green: {
    dot: '#00ff88',
    title: '#00ff88',
    line: '#00ff88',
    glow: 'rgba(0,255,136,0.3)',
  },
  amber: {
    dot: '#ffaa00',
    title: '#ffaa00',
    line: '#ffaa00',
    glow: 'rgba(255,170,0,0.3)',
  },
  red: {
    dot: '#ff3366',
    title: '#ff3366',
    line: '#ff3366',
    glow: 'rgba(255,51,102,0.3)',
  },
};

type Props = {
  title: string;
  accent: Accent;
  children: ReactNode;
  style?: React.CSSProperties;
};

export default function Card({ title, accent, children, style }: Props) {
  const a = ACCENT_MAP[accent];
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={cardRef}
      className="panel"
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        marginBottom: 0,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        borderColor: hovered ? `${a.dot}35` : 'rgba(0,180,255,0.14)',
        boxShadow: hovered
          ? `0 0 40px ${a.glow}22, 0 0 1px ${a.dot}20 inset`
          : 'none',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Mouse-following radial glow */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${a.glow}14 0%, transparent 55%)`,
            pointerEvents: 'none',
            zIndex: 0,
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Top gradient line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: 1,
          background: `linear-gradient(90deg, transparent, ${a.dot}, transparent)`,
          boxShadow: `0 0 12px ${a.glow}`,
          opacity: hovered ? 0.9 : 0.5,
          transition: 'opacity 0.3s',
          zIndex: 1,
        }}
      />

      {/* HEADER */}
      <div className="panel-header" style={{ zIndex: 1, position: 'relative' }}>
        <div
          className="panel-accent-dot"
          style={{
            background: a.dot,
            boxShadow: `0 0 10px ${a.glow}, 0 0 20px ${a.glow}`,
          }}
        />
        <div className="panel-title" style={{ color: a.title }}>
          {title}
        </div>

        {/* Right corner decoration */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 4,
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: a.dot,
                opacity: 0.2 + i * 0.25,
                boxShadow: `0 0 4px ${a.glow}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom line under header */}
      <div
        style={{
          position: 'absolute',
          top: 47,
          left: 20,
          width: hovered ? 80 : 50,
          height: 1,
          background: a.line,
          boxShadow: `0 0 8px ${a.glow}`,
          transition: 'width 0.4s ease',
          zIndex: 1,
        }}
      />

      {/* BODY */}
      <div className="panel-body" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      {/* Corner bracket TL */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 20,
          height: 20,
          borderTop: `1px solid ${a.dot}`,
          borderLeft: `1px solid ${a.dot}`,
          opacity: 0.6,
        }}
      />

      {/* Corner bracket BR */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 20,
          height: 20,
          borderBottom: `1px solid ${a.dot}`,
          borderRight: `1px solid ${a.dot}`,
          opacity: 0.6,
        }}
      />
    </div>
  );
}
