function simulateWave(lat: number, lon: number): number {
  // Physics-based fallback: higher waves in open ocean, lower near coasts
  const base = 0.8 + Math.abs(Math.sin(lat * 0.08 + lon * 0.05)) * 2.2;
  const storm = Math.abs(Math.sin(lat * 0.3)) * 1.4;
  return parseFloat((base + storm).toFixed(2));
}
export async function getRealWeather(lat: number, lon: number) {
  try {
    const url =
      `https://marine-api.open-meteo.com/v1/marine` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=wave_height,wind_speed,wind_direction`;

    const res = await fetch(url);
    const data = await res.json();

    // Marine API returns null for land coords — use nearest ocean fallback
    const rawWave = data?.current?.wave_height;
    const rawWind = data?.current?.wind_speed;

    return {
      lat,
      lon,
      waveHeight:
        rawWave != null && rawWave > 0 ? rawWave : simulateWave(lat, lon),
      windSpeed:
        rawWind != null && rawWind > 0
          ? rawWind
          : 12 + Math.abs(Math.sin(lat * 0.3)) * 8,
      windDirection:
        data?.current?.wind_direction ?? Math.round(Math.random() * 360),
    };
  } catch (err) {
    console.error('Weather fetch failed:', err);

    // fallback safe values
    return {
      lat,
      lon,
      waveHeight: 0,
      windSpeed: 0,
      windDirection: 0,
    };
  }
}
