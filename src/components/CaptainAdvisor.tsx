type Props = {
  waveHeight: number | null;
  totalHours: number;
  totalFuel: number;
};

export default function CaptainAdvisor({
  waveHeight,
  totalHours,
  totalFuel,
}: Props) {
  const risk =
    waveHeight !== null && waveHeight > 3
      ? 'HIGH'
      : waveHeight !== null && waveHeight > 1.5
      ? 'MODERATE'
      : 'LOW';
  const color =
    risk === 'HIGH' ? '#ff3366' : risk === 'MODERATE' ? '#ffaa00' : '#00ff88';
  const advice =
    risk === 'HIGH'
      ? 'Adverse sea conditions detected. Recommend reducing speed and switching to weather-optimized route.'
      : risk === 'MODERATE'
      ? 'Moderate swell detected. Monitor conditions closely. Maintain planned speed with caution.'
      : 'Sea conditions are calm. Maintain planned speed. No significant delay risk detected.';

  const rows = [
    {
      label: 'WAVE HEIGHT',
      value: waveHeight !== null ? `${waveHeight} M` : '— M',
    },
    {
      label: 'VOYAGE HOURS',
      value: isNaN(totalHours) ? '—' : `${totalHours.toFixed(1)} H`,
    },
    {
      label: 'FUEL FORECAST',
      value: isNaN(totalFuel) ? '—' : `${totalFuel.toFixed(1)} T`,
    },
    { label: 'RISK LEVEL', value: risk },
  ];

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              padding: '12px 14px',
              background: 'rgba(4,20,40,0.8)',
              border: '1px solid rgba(0,180,255,0.15)',
              borderRadius: '2px',
            }}
          >
            <div
              style={{
                fontFamily: 'Orbitron',
                fontSize: '9px',
                letterSpacing: '0.2em',
                color: '#3a6a8a',
                marginBottom: '6px',
              }}
            >
              {r.label}
            </div>
            <div
              style={{
                fontFamily: 'Share Tech Mono',
                fontSize: '16px',
                color: r.label === 'RISK LEVEL' ? color : '#00ffea',
              }}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          padding: '14px 16px',
          background: `${color}10`,
          border: `1px solid ${color}30`,
          borderLeft: `3px solid ${color}`,
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: '9px',
            letterSpacing: '0.2em',
            color,
            marginBottom: '6px',
          }}
        >
          ADVISORY — RISK {risk}
        </div>
        <div
          style={{
            fontFamily: 'Rajdhani',
            fontSize: '14px',
            color: '#e0f4ff',
            lineHeight: 1.6,
          }}
        >
          {advice}
        </div>
      </div>
    </div>
  );
}
