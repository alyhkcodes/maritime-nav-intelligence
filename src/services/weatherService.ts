export async function getWeather(lat: number, lon: number) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height`;

  const response = await fetch(url);

  const data = await response.json();

  return {
    waveHeight: data.hourly?.wave_height?.[0] ?? 0,
  };
}
