export function beaufortFromWaveHeight(waveHeight: number) {
  if (waveHeight < 0.5) return 2;
  if (waveHeight < 1.25) return 3;
  if (waveHeight < 2.5) return 4;
  if (waveHeight < 4.0) return 5;
  if (waveHeight < 6.0) return 6;
  if (waveHeight < 9.0) return 7;
  return 8;
}

export function speedLossFactor(bf: number, headSeas: boolean) {
  const base: Record<number, number> = {
    3: 0.02,
    4: 0.05,
    5: 0.1,
    6: 0.17,
    7: 0.25,
    8: 0.38,
  };

  const factor = base[bf] || 0;

  return headSeas ? factor : factor * 0.6;
}

export function fuelIncrease(
  stwKnots: number,
  sogKnots: number,
  baseFuelTPD: number
) {
  const ratio = stwKnots / sogKnots;

  return baseFuelTPD * (Math.pow(ratio, 3) - 1);
}
export function haversineDistance(
  point1: { lat: number; lon: number },
  point2: { lat: number; lon: number }
) {
  const R = 3440.065; // Earth radius in nautical miles

  const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;

  const dLon = ((point2.lon - point1.lon) * Math.PI) / 180;

  const lat1 = (point1.lat * Math.PI) / 180;

  const lat2 = (point2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
export function calculateVoyage(
  waypoints: { lat: number; lon: number }[],
  vesselConfig: {
    stwKnots: number;
    baseFuelTPD: number;
    fuelPricePerTon: number;
  }
) {
  let totalDistance = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistance += haversineDistance(waypoints[i], waypoints[i + 1]);
  }

  const totalHours = totalDistance / vesselConfig.stwKnots;

  const totalFuelTons = (totalHours / 24) * vesselConfig.baseFuelTPD;

  const totalCost = totalFuelTons * vesselConfig.fuelPricePerTon;

  return {
    totalDistance,
    totalHours,
    totalFuelTons,
    totalCost,
  };
}
export function calculateVoyageWithWeather(
  waypoints: { lat: number; lon: number }[],
  weatherData: { waveHeight: number }[],
  vesselConfig: {
    stwKnots: number;
    baseFuelTPD: number;
    fuelPricePerTon: number;
  }
) {
  let totalDistance = 0;
  let totalHours = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const distance = haversineDistance(waypoints[i], waypoints[i + 1]);

    totalDistance += distance;

    const waveHeight = weatherData[i]?.waveHeight ?? 0;

    const bf = beaufortFromWaveHeight(waveHeight);

    const loss = speedLossFactor(bf, true);

    const sog = vesselConfig.stwKnots * (1 - loss);

    totalHours += distance / sog;
  }

  const totalFuelTons = (totalHours / 24) * vesselConfig.baseFuelTPD;

  const totalCost = totalFuelTons * vesselConfig.fuelPricePerTon;

  return {
    totalDistance,
    totalHours,
    totalFuelTons,
    totalCost,
  };
}
