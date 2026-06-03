type Route = {
  name: string;
  hours: number;
  fuel: number;
  cost: number;
};

type WeatherPoint = {
  waveHeight: number;
  windSpeed: number;
};

function avgWeather(weather: WeatherPoint[]) {
  const len = weather.length || 1;

  return {
    wave: weather.reduce((a, b) => a + b.waveHeight, 0) / len,
    wind: weather.reduce((a, b) => a + b.windSpeed, 0) / len,
  };
}

// 🧠 MAIN AI SCORING FUNCTION
export function scoreRoute(route: Route, weather: WeatherPoint[]) {
  const avg = avgWeather(weather);

  // 🌊 wave penalty (strong impact)
  const wavePenalty = avg.wave * 1.8;

  // 🌬 wind penalty (medium impact)
  const windPenalty = avg.wind * 0.6;

  // ⛽ cost weight
  const costPenalty = route.cost / 10000;

  // ⏱ time weight
  const timePenalty = route.hours / 100;

  // 🧠 FINAL SCORE (lower is better)
  const score = wavePenalty + windPenalty + costPenalty + timePenalty;

  let label = 'GOOD';

  if (score > 8) label = 'RISKY';
  if (score > 12) label = 'DANGEROUS';

  return {
    score: Number(score.toFixed(2)),
    label,
  };
}

// 🧠 BEST ROUTE SELECTOR
export function getBestRoute(
  routes: Route[],
  weatherMap: Record<string, WeatherPoint[]>
) {
  let best = routes[0];
  let bestScore = Infinity;

  const results = routes.map((r) => {
    const weather = weatherMap[r.name] || [];
    const { score, label } = scoreRoute(r, weather);

    if (score < bestScore) {
      best = r;
      bestScore = score;
    }

    return {
      ...r,
      score,
      label,
    };
  });

  return {
    bestRoute: best,
    ranked: results.sort((a, b) => a.score - b.score),
  };
}
