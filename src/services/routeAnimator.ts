import type { Point } from '../types/geo';

export function interpolate(start: Point, end: Point, t: number): Point {
  return {
    lat: start.lat + (end.lat - start.lat) * t,
    lon: start.lon + (end.lon - start.lon) * t,
  };
}

// get ship position along route
export function getPositionAlongRoute(route: Point[], progress: number): Point {
  if (!route.length) return { lat: 0, lon: 0 };

  const totalSegments = route.length - 1;
  const scaled = progress * totalSegments;

  const index = Math.floor(scaled);
  const t = scaled - index;

  const start = route[index];
  const end = route[Math.min(index + 1, route.length - 1)];

  return interpolate(start, end, t);
}
