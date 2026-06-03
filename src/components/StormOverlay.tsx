type Point = { lat: number; lon: number };
type Props = { route: Point[] };

const STORM_ZONES = [
  { lat: 5.0, lon: 90.0, radius: 3, name: 'Tropical Storm Alpha' },
  { lat: 10.0, lon: 88.0, radius: 2, name: 'Squall Zone Beta' },
];

function distance(a: Point, b: Point) {
  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lon - b.lon, 2));
}

export default function StormOverlay({ route }: Props) {
  const warnings = STORM_ZONES.filter((storm) =>
    route.some((point) => distance(point, storm) < storm.radius)
  );

  if (warnings.length === 0) {
    return (
      <div
        style={{
          marginTop: '8px',
          padding: '8px 12px',
          background: 'rgba(0,255,136,0.06)',
          border: '1px solid rgba(0,255,136,0.2)',
          borderLeft: '3px solid #00ff88',
          borderRadius: '2px',
          fontFamily: 'Rajdhani',
          fontSize: '13px',
          color: '#00ff88',
        }}
      >
        ✅ No storm zones detected along this route
      </div>
    );
  }

  return (
    <div style={{ marginTop: '8px', display: 'grid', gap: '6px' }}>
      {warnings.map((w) => (
        <div
          key={w.name}
          style={{
            padding: '8px 12px',
            background: 'rgba(255,51,102,0.06)',
            border: '1px solid rgba(255,51,102,0.2)',
            borderLeft: '3px solid #ff3366',
            borderRadius: '2px',
            fontFamily: 'Rajdhani',
            fontSize: '13px',
            color: '#ff3366',
          }}
        >
          ⛈️ <strong>WARNING:</strong> Route passes near{' '}
          <strong>{w.name}</strong>
        </div>
      ))}
    </div>
  );
}
