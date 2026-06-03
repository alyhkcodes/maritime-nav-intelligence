import { useEffect, useState } from 'react';

type Point = { lat: number; lon: number };
type Props = { route: Point[] };

export default function AnimatedShip({ route }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (route.length === 0) return;
    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % route.length);
    }, 1500);
    return () => clearInterval(t);
  }, [route]);

  const current = route[index];

  return (
    <div style={{ padding: '10px 0', fontSize: 14, color: '#374151' }}>
      🚢 <strong>Animated Position:</strong> Lat {current?.lat.toFixed(2)}, Lon{' '}
      {current?.lon.toFixed(2)} — Waypoint {index + 1} of {route.length}
    </div>
  );
}
