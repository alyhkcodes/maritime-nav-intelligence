import { useEffect, useState } from 'react';
import { getPositionAlongRoute } from '../services/routeAnimator';

export default function LiveShipMarker({ route }: any) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        let next = p + 0.002;
        if (next > 1) next = 0;
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const position = getPositionAlongRoute(route, progress);

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${position.lon}px, ${position.lat}px)`,
        transition: 'transform 0.1s linear',
      }}
    >
      🚢
    </div>
  );
}
