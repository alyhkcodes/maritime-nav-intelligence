import { useEffect, useState } from 'react';

type Ship = { id: string; name: string; routeIndex: number; progress: number };

function createFleet(): Ship[] {
  return [
    { id: 's1', name: 'Neptune Carrier', routeIndex: 0, progress: 0 },
    { id: 's2', name: 'Ocean Titan', routeIndex: 1, progress: 0.3 },
    { id: 's3', name: 'Pacific Star', routeIndex: 2, progress: 0.6 },
  ];
}

export default function FleetTracker() {
  const [fleet, setFleet] = useState<Ship[]>(createFleet());

  useEffect(() => {
    const interval = setInterval(() => {
      setFleet((prev) =>
        prev.map((ship) => ({
          ...ship,
          progress: ship.progress >= 1 ? 0 : ship.progress + 0.005,
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {fleet.map((ship, i) => {
        const colors = ['#00ffea', '#00b4ff', '#00ff88'];
        const color = colors[i % colors.length];
        return (
          <div
            key={ship.id}
            style={{
              padding: '12px 14px',
              background: 'rgba(4,20,40,0.8)',
              border: `1px solid ${color}25`,
              borderLeft: `3px solid ${color}`,
              borderRadius: '2px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Rajdhani',
                  fontWeight: 600,
                  fontSize: '15px',
                  color,
                }}
              >
                {ship.name}
              </span>
              <span
                style={{
                  fontFamily: 'Share Tech Mono',
                  fontSize: '12px',
                  color: '#3a6a8a',
                }}
              >
                {(ship.progress * 100).toFixed(1)}%
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'rgba(0,180,255,0.1)',
                borderRadius: '2px',
              }}
            >
              <div
                style={{
                  width: `${ship.progress * 100}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${color}80, ${color})`,
                  borderRadius: '2px',
                  boxShadow: `0 0 8px ${color}60`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
