import { useMemo } from 'react';

type Route = {
  name: string;
  hours: number;
  fuel: number;
  cost: number;
};

type Props = {
  routes: Route[];
  waveHeight: number | null;
  selectedRoute?: number;
  onSelect?: (i: number) => void;
};

function computeRisk(
  route: Route,
  waveHeight: number | null,
  index: number
): {
  score: number;
  breakdown: { label: string; value: number; color: string }[];
  verdict: string;
  color: string;
} {
  // Normalize factors to 0-100
  // Higher cost = more expensive = higher risk weight
  const maxCost = 200000;
  const costScore = Math.min(100, (route.cost / maxCost) * 40); // 40pts max

  // Wave height
  const wave = waveHeight ?? 1.5;
  const waveScore = Math.min(100, (wave / 8) * 30); // 30pts max

  // Route duration (longer = more exposure)
  const durationScore = Math.min(100, (route.hours / 400) * 20); // 20pts max

  // Piracy proximity (based on route index as demo — in real app check against zones)
  const piracyScores = [5, 25, 35, 15, 10]; // per route index
  const piracyScore = piracyScores[index % piracyScores.length];

  const total = Math.round(costScore + waveScore + durationScore + piracyScore);
  const clamped = Math.min(100, Math.max(0, total));

  let verdict: string;
  let color: string;
  if (clamped < 25) {
    verdict = 'LOW RISK';
    color = '#00ff88';
  } else if (clamped < 50) {
    verdict = 'MODERATE';
    color = '#88ff44';
  } else if (clamped < 70) {
    verdict = 'ELEVATED';
    color = '#ffaa00';
  } else if (clamped < 85) {
    verdict = 'HIGH RISK';
    color = '#ff6600';
  } else {
    verdict = 'CRITICAL';
    color = '#ff3366';
  }

  return {
    score: clamped,
    verdict,
    color,
    breakdown: [
      {
        label: 'Cost Exposure',
        value: Math.round(costScore),
        color: '#ff8844',
      },
      { label: 'Weather', value: Math.round(waveScore), color: '#44aaff' },
      { label: 'Duration', value: Math.round(durationScore), color: '#aa88ff' },
      { label: 'Piracy', value: Math.round(piracyScore), color: '#ff3366' },
    ],
  };
}

function RiskGauge({ score, color }: { score: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  const offset = circ * (1 - pct * 0.75); // 3/4 circle arc
  const startAngle = 135; // degrees

  return (
    <svg width={70} height={70} viewBox="0 0 70 70">
      {/* Track */}
      <circle
        cx={35}
        cy={35}
        r={r}
        fill="none"
        stroke="rgba(0,180,255,0.1)"
        strokeWidth={6}
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${startAngle} 35 35)`}
      />
      {/* Fill */}
      <circle
        cx={35}
        cy={35}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${circ * 0.75 * pct} ${circ * (1 - 0.75 * pct)}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${startAngle} 35 35)`}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
      {/* Score text */}
      <text
        x={35}
        y={33}
        textAnchor="middle"
        fill={color}
        fontFamily="Orbitron, sans-serif"
        fontSize={14}
        fontWeight={700}
      >
        {score}
      </text>
      <text
        x={35}
        y={44}
        textAnchor="middle"
        fill={color}
        fontFamily="Rajdhani, sans-serif"
        fontSize={8}
        opacity={0.8}
      >
        /100
      </text>
    </svg>
  );
}

export default function RouteRiskScore({
  routes,
  waveHeight,
  selectedRoute = 0,
  onSelect,
}: Props) {
  const risks = useMemo(
    () => routes.map((r, i) => computeRisk(r, waveHeight, i)),
    [routes, waveHeight]
  );

  const bestIdx = useMemo(
    () =>
      risks.reduce((best, r, i) => (r.score < risks[best].score ? i : best), 0),
    [risks]
  );

  return (
    <div
      style={{
        background: 'rgba(4,20,40,0.6)',
        border: '1px solid rgba(0,180,255,0.15)',
        borderRadius: '4px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: '11px',
            color: '#00b4ff',
            letterSpacing: '0.15em',
          }}
        >
          ROUTE RISK MATRIX
        </div>
        <div
          style={{ fontFamily: 'Rajdhani', fontSize: '11px', color: '#00ff88' }}
        >
          RECOMMENDED: {routes[bestIdx]?.name}
        </div>
      </div>

      {/* Route cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {routes.map((route, i) => {
          const risk = risks[i];
          const isSelected = i === selectedRoute;
          const isBest = i === bestIdx;

          return (
            <div
              key={route.name}
              onClick={() => onSelect?.(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                background: isSelected
                  ? 'rgba(0,80,160,0.25)'
                  : 'rgba(0,0,0,0.3)',
                border: `1px solid ${
                  isSelected ? 'rgba(0,180,255,0.4)' : 'rgba(0,180,255,0.1)'
                }`,
                borderRadius: '3px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Best badge */}
              {isBest && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 6,
                    fontFamily: 'Orbitron',
                    fontSize: '8px',
                    color: '#00ff88',
                    letterSpacing: '0.1em',
                  }}
                >
                  ★ OPTIMAL
                </div>
              )}

              {/* Gauge */}
              <RiskGauge score={risk.score} color={risk.color} />

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Rajdhani',
                      fontSize: '14px',
                      color: '#d0eeff',
                      fontWeight: 600,
                    }}
                  >
                    {route.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Orbitron',
                      fontSize: '9px',
                      color: risk.color,
                      background: risk.color + '20',
                      border: `1px solid ${risk.color}40`,
                      padding: '1px 6px',
                      borderRadius: '2px',
                    }}
                  >
                    {risk.verdict}
                  </span>
                </div>

                {/* Factor bars */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {risk.breakdown.map((b) => (
                    <div
                      key={b.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        flex: '1 1 80px',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 3,
                          background: 'rgba(0,0,0,0.4)',
                          borderRadius: '1px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${b.value}%`,
                            background: b.color,
                            borderRadius: '1px',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: 'Rajdhani',
                          fontSize: '9px',
                          color: '#4a8aaa',
                        }}
                      >
                        {b.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{
                    fontFamily: 'Share Tech Mono',
                    fontSize: '13px',
                    color: '#ffaa00',
                  }}
                >
                  ${route.cost.toLocaleString()}
                </div>
                <div
                  style={{
                    fontFamily: 'Rajdhani',
                    fontSize: '10px',
                    color: '#4a8aaa',
                  }}
                >
                  {route.hours.toFixed(0)}h
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
