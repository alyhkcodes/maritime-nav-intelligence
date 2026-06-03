import { useState } from 'react';

type Scenario = { name: string; hours: number; fuel: number; cost: number };
type Props = { routes: Scenario[]; waveHeight: number | null };

export default function RouteOptimizer({ routes, waveHeight }: Props) {
  const sorted = [...routes].sort((a, b) => a.cost - b.cost);
  const best = sorted[0];
  const highSeas = waveHeight !== null && waveHeight > 3;
  const recommended = highSeas ? sorted[1] ?? best : best;
  const recColor = highSeas ? '#ffaa00' : '#00ff88';
  const maxCost = Math.max(...sorted.map((r) => r.cost));
  const [hovered, setHovered] = useState<string | null>(null);

  const routeColors = ['#00ffea', '#00b4ff', '#aa44ff'];

  return (
    <div>
      {/* Recommendation banner */}
      <div
        style={{
          padding: '14px 16px',
          marginBottom: 16,
          background: `linear-gradient(135deg, ${recColor}0c 0%, transparent 100%)`,
          border: `1px solid ${recColor}28`,
          borderLeft: `3px solid ${recColor}`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInUp 0.4s ease forwards',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, ${recColor}06 0%, transparent 60%)`,
            animation: 'wxSweep 5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: 9,
            letterSpacing: '0.22em',
            color: recColor,
            marginBottom: 8,
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
              background: recColor,
              boxShadow: `0 0 8px ${recColor}`,
              animation: 'accentPulse 2s ease-in-out infinite',
            }}
          />
          {highSeas
            ? '⚠ HIGH SEAS — ALTERNATE ADVISED'
            : '✓ OPTIMAL ROUTE IDENTIFIED'}
        </div>
        <div
          style={{
            fontFamily: 'Rajdhani',
            fontSize: 15,
            color: 'var(--text-primary)',
            position: 'relative',
          }}
        >
          <strong style={{ color: recColor }}>{recommended.name}</strong>
          {' — '}
          <span
            style={{
              fontFamily: 'Share Tech Mono',
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            ${recommended.cost.toFixed(0)} over {recommended.hours.toFixed(1)}{' '}
            hrs
          </span>
        </div>
      </div>

      {/* Route cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map((r, i) => {
          const isTop = i === 0;
          const color = routeColors[i] ?? 'var(--text-dim)';
          const costPct = (r.cost / maxCost) * 100;
          const isHov = hovered === r.name;
          const isRec = r.name === recommended.name;

          return (
            <div
              key={r.name}
              className="route-card"
              onMouseEnter={() => setHovered(r.name)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHov
                  ? `linear-gradient(135deg, ${color}0c 0%, rgba(4,14,30,0.95) 100%)`
                  : isTop
                  ? 'rgba(0,255,234,0.04)'
                  : 'rgba(4,20,40,0.6)',
                border: `1px solid ${
                  isHov
                    ? color + '40'
                    : isRec
                    ? color + '25'
                    : 'rgba(0,180,255,0.1)'
                }`,
                borderLeft: `2px solid ${
                  isHov || isRec ? color + '80' : color + '30'
                }`,
                boxShadow: isHov ? `0 0 20px ${color}15` : 'none',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {/* Route name */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 1,
                      background: color,
                      boxShadow: `0 0 8px ${color}`,
                      opacity: isHov ? 1 : 0.7,
                      transition: 'all 0.2s',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'Rajdhani',
                      fontWeight: 600,
                      fontSize: 14,
                      color: isHov
                        ? color
                        : isTop
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                      transition: 'color 0.2s',
                    }}
                  >
                    {r.name}
                  </span>
                  {isRec && (
                    <span
                      style={{
                        padding: '1px 8px',
                        background: `${recColor}18`,
                        border: `1px solid ${recColor}40`,
                        borderRadius: 20,
                        fontFamily: 'Orbitron',
                        fontSize: 7,
                        letterSpacing: '0.15em',
                        color: recColor,
                      }}
                    >
                      RECOMMENDED
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: 'Share Tech Mono',
                    fontSize: 13,
                    color: isHov ? color : 'var(--text-secondary)',
                    transition: 'color 0.2s',
                  }}
                >
                  ${r.cost.toFixed(0)}
                </span>
              </div>

              {/* Cost bar */}
              <div
                style={{
                  height: 3,
                  background: 'rgba(0,180,255,0.08)',
                  borderRadius: 2,
                  marginBottom: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: isHov ? `${costPct}%` : `${costPct * 0.92}%`,
                    background: `linear-gradient(90deg, ${color}88, ${color})`,
                    borderRadius: 2,
                    transition:
                      'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 20,
                      background:
                        'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
                    }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  fontFamily: 'Share Tech Mono',
                  fontSize: 10,
                  color: 'var(--text-dim)',
                }}
              >
                <span>⏱ {r.hours.toFixed(1)}h</span>
                <span>⛽ {r.fuel.toFixed(1)}T</span>
                <span style={{ marginLeft: 'auto', color: color + '88' }}>
                  {i === 0
                    ? '★ CHEAPEST'
                    : i === sorted.length - 1
                    ? '△ EXPENSIVE'
                    : '◇ MID'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
