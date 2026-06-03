import { useRef, useEffect, useState } from 'react';

type Props = { title: string; value: string };

export default function StatCard({ title, value }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [displayed, setDisplayed] = useState(value);
  const prevValue = useRef(value);

  // Animate value change
  useEffect(() => {
    if (value !== prevValue.current) {
      setDisplayed('...');
      const t = setTimeout(() => {
        setDisplayed(value);
        prevValue.current = value;
      }, 200);
      return () => clearTimeout(t);
    }
  }, [value]);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -12, y: dx * 12 });
  };

  const onMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className="stat-card-3d"
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${
          tilt.y
        }deg) ${hovered ? 'scale(1.04)' : 'scale(1)'}`,
        boxShadow: hovered
          ? `0 0 40px rgba(0,180,255,0.25), 0 0 80px rgba(0,180,255,0.08), inset 0 0 40px rgba(0,180,255,0.05), 0 ${
              20 + tilt.x
            }px 40px rgba(0,0,0,0.4)`
          : '0 4px 20px rgba(0,0,0,0.3)',
        transition: hovered
          ? 'transform 0.08s ease, box-shadow 0.2s ease'
          : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.5s ease',
      }}
    >
      {/* Holographic shimmer */}
      <div className="holo-shimmer" />

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${
            hovered ? '#00ffea' : '#00b4ff'
          }, transparent)`,
          opacity: hovered ? 1 : 0.6,
          transition: 'all 0.3s',
        }}
      />

      {/* Corner accents */}
      <div className="corner-tl" />
      <div className="corner-br" />

      {/* Depth layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at ${50 + tilt.y * 3}% ${
            50 + tilt.x * 3
          }%, rgba(0,180,255,0.06) 0%, transparent 70%)`,
          transition: 'background 0.08s',
          borderRadius: 'inherit',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div className="stat-card-label">{title}</div>
      <div
        className="stat-card-value"
        style={{
          opacity: displayed === '...' ? 0.3 : 1,
          transform: displayed === '...' ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.2s',
        }}
      >
        {displayed}
      </div>

      {/* Bottom scan line */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              'linear-gradient(90deg, transparent, rgba(0,255,234,0.4), transparent)',
            animation: 'none',
          }}
        />
      )}
    </div>
  );
}
