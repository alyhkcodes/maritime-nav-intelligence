import { useState, useEffect, useRef } from 'react';

type Props = {
  baseCost: number;
  baseHours: number;
  offset: number;
  onChange: (val: number) => void;
};

type WeatherForecast = {
  hour: number;
  waveHeight: number;
  windSpeed: number;
  swellPeriod: number;
};

function AnimatedValue({
  value,
  prefix = '',
  suffix = '',
  color,
}: {
  value: string;
  prefix?: string;
  suffix?: string;
  color: string;
}) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      setDisp('---');
      const t = setTimeout(() => {
        setDisp(value);
        prev.current = value;
      }, 180);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      style={{ color, fontFamily: 'Share Tech Mono', transition: 'all 0.2s' }}
    >
      {prefix}
      {disp}
      {suffix}
    </span>
  );
}

// Fetch wave forecast from Open-Meteo (free, no API key)
// Uses Rotterdam coordinates as departure point (lat 51.9, lon 4.5)
async function fetchMarineForecast(): Promise<WeatherForecast[]> {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=51.9&longitude=4.5&hourly=wave_height,wind_wave_height,swell_wave_period&forecast_days=7&timezone=UTC`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather API error');
  const data = await res.json();
  const hours = data.hourly;
  return hours.time.map((t: string, i: number) => ({
    hour: i,
    waveHeight: hours.wave_height[i] ?? 0,
    windSpeed: hours.wind_wave_height[i] ?? 0,
    swellPeriod: hours.swell_wave_period[i] ?? 8,
  }));
}

function getSeaState(waveHeight: number): { label: string; color: string } {
  if (waveHeight < 0.5) return { label: 'Calm', color: '#00ff88' };
  if (waveHeight < 1.25) return { label: 'Slight', color: '#88ff44' };
  if (waveHeight < 2.5) return { label: 'Moderate', color: '#ffdd00' };
  if (waveHeight < 4.0) return { label: 'Rough', color: '#ff8800' };
  if (waveHeight < 6.0) return { label: 'Very Rough', color: '#ff4400' };
  return { label: 'High Seas', color: '#ff3366' };
}

export default function TimeMachine({
  baseCost,
  baseHours,
  offset,
  onChange,
}: Props) {
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMarineForecast()
      .then(setForecast)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Get wave height for current offset (offset in days, map to hour index)
  const currentHourIdx = Math.min(Math.round(offset * 24), forecast.length - 1);
  const currentForecast = forecast[currentHourIdx] ?? null;
  const waveH = currentForecast?.waveHeight ?? null;
  const seaState = waveH !== null ? getSeaState(waveH) : null;

  // Fuel penalty from weather (rough seas = more fuel burn)
  const weatherFuelMultiplier =
    waveH !== null
      ? 1 + Math.max(0, (waveH - 1.5) * 0.04) // 4% per meter above 1.5m
      : 1;

  const adjustedHours = baseHours + offset * 24;
  const adjustedFuel = Math.round(
    baseHours * 10 * (1 + offset * 0.02) * weatherFuelMultiplier
  );
  const adjustedCost = Math.round(
    baseCost * (1 + offset * 0.015) * weatherFuelMultiplier
  );
  const costDelta = adjustedCost - baseCost;

  // Build 7-day chart data from forecast
  const chartData = Array.from({ length: 7 }, (_, day) => {
    const idx = Math.min(day * 24 + 12, forecast.length - 1);
    return forecast[idx]?.waveHeight ?? 0;
  });
  const maxWave = Math.max(...chartData, 0.1);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontFamily: 'Orbitron',
          fontSize: '11px',
          color: '#00b4ff',
          letterSpacing: '0.15em',
        }}
      >
        DEPARTURE TIME OPTIMIZER
        {!loading && !error && (
          <span
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '10px',
              color: '#00ff88',
              marginLeft: '10px',
              letterSpacing: '0.05em',
            }}
          >
            ● LIVE WEATHER
          </span>
        )}
        {loading && (
          <span
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '10px',
              color: '#ffaa00',
              marginLeft: '10px',
            }}
          >
            ◌ Loading forecast...
          </span>
        )}
        {error && (
          <span
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '10px',
              color: '#ff6644',
              marginLeft: '10px',
            }}
          >
            ⚠ Offline mode
          </span>
        )}
      </div>

      {/* Slider */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '12px',
              color: '#6ab4d0',
            }}
          >
            DEPART NOW
          </span>
          <span
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '12px',
              color: '#6ab4d0',
            }}
          >
            +7 DAYS
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={7}
          step={0.25}
          value={offset}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#00b4ff',
            cursor: 'pointer',
            height: '4px',
          }}
        />
        <div style={{ textAlign: 'center', marginTop: '4px' }}>
          <span
            style={{
              fontFamily: 'Orbitron',
              fontSize: '13px',
              color: '#00ffea',
            }}
          >
            {offset === 0 ? 'DEPART NOW' : `+${offset.toFixed(2)} DAYS`}
          </span>
        </div>
      </div>

      {/* Wave forecast mini-chart */}
      {!loading && forecast.length > 0 && (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '10px',
              color: '#4a7090',
              marginBottom: '4px',
              letterSpacing: '0.1em',
            }}
          >
            7-DAY WAVE FORECAST (ROTTERDAM DEPARTURE)
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2px',
              height: 36,
            }}
          >
            {chartData.map((h, i) => {
              const dayOffset = i;
              const isActive = Math.floor(offset) === dayOffset;
              const ss = getSeaState(h);
              return (
                <div
                  key={i}
                  title={`Day ${i}: ${h.toFixed(1)}m — ${ss.label}`}
                  style={{
                    flex: 1,
                    height: `${Math.max(8, (h / maxWave) * 100)}%`,
                    background: isActive ? ss.color : ss.color + '60',
                    borderRadius: '1px 1px 0 0',
                    boxShadow: isActive ? `0 0 8px ${ss.color}` : 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => onChange(dayOffset)}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '2px' }}>
            {['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'].map((d, i) => (
              <div
                key={d}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontFamily: 'Rajdhani',
                  fontSize: '9px',
                  color: Math.floor(offset) === i ? '#00b4ff' : '#2a4060',
                  marginTop: '2px',
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current conditions */}
      {seaState && waveH !== null && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${seaState.color}30`,
            borderRadius: '3px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: seaState.color,
              boxShadow: `0 0 8px ${seaState.color}`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '13px',
              color: seaState.color,
            }}
          >
            {seaState.label}
          </span>
          <span
            style={{
              fontFamily: 'Share Tech Mono',
              fontSize: '13px',
              color: '#6ab4d0',
              marginLeft: 'auto',
            }}
          >
            {waveH.toFixed(1)}m waves
          </span>
          {currentForecast && (
            <span
              style={{
                fontFamily: 'Rajdhani',
                fontSize: '11px',
                color: '#3a6080',
              }}
            >
              · {currentForecast.swellPeriod?.toFixed(0) ?? '—'}s swell
            </span>
          )}
        </div>
      )}

      {/* Adjusted metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        {[
          {
            label: 'ADJ. HOURS',
            value: adjustedHours.toFixed(1),
            suffix: 'h',
            color: '#00b4ff',
            delta: null,
          },
          {
            label: 'ADJ. FUEL',
            value: adjustedFuel.toLocaleString(),
            suffix: 't',
            color: waveH && waveH > 2.5 ? '#ff8844' : '#88ff44',
            delta: null,
          },
          {
            label: 'COST DELTA',
            value: `${costDelta >= 0 ? '+' : ''}$${Math.abs(
              costDelta
            ).toLocaleString()}`,
            suffix: '',
            color: costDelta > 0 ? '#ff6644' : '#00ff88',
            delta: costDelta,
          },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(0,180,255,0.1)',
              borderRadius: '3px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'Share Tech Mono',
                fontSize: '14px',
                color: m.color,
              }}
            >
              <AnimatedValue
                value={m.value}
                suffix={m.suffix}
                color={m.color}
              />
            </div>
            <div
              style={{
                fontFamily: 'Rajdhani',
                fontSize: '10px',
                color: '#5a9ab8',
                letterSpacing: '0.1em',
                marginTop: '2px',
              }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Voyage timeline playback */}
      <div>
        <div
          style={{
            fontFamily: 'Rajdhani',
            fontSize: '10px',
            color: '#4a7090',
            marginBottom: '6px',
            letterSpacing: '0.1em',
          }}
        >
          VOYAGE TIMELINE — WEATHER ALONG ROUTE
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '11px',
              color: '#3a6a8a',
            }}
          >
            DEPARTURE
          </span>
          <span
            style={{
              fontFamily: 'Share Tech Mono',
              fontSize: '11px',
              color: '#00ffea',
            }}
          >
            T+{adjustedHours.toFixed(0)}h
          </span>
          <span
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '11px',
              color: '#3a6a8a',
            }}
          >
            ARRIVAL
          </span>
        </div>
        <div
          style={{
            position: 'relative',
            height: '28px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '2px',
            overflow: 'hidden',
            border: '1px solid rgba(0,180,255,0.1)',
          }}
        >
          {/* Colour-coded weather segments */}
          {forecast.length > 0 &&
            chartData.map((h, i) => {
              const ss = getSeaState(h);
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${(i / 7) * 100}%`,
                    width: `${100 / 7}%`,
                    height: '100%',
                    background: ss.color + '30',
                    borderRight: '1px solid rgba(0,0,0,0.3)',
                  }}
                  title={`Day ${i}: ${h.toFixed(1)}m — ${ss.label}`}
                />
              );
            })}
          {/* Progress fill */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${(offset / 7) * 100}%`,
              height: '100%',
              background: 'rgba(0,180,255,0.15)',
              borderRight: '2px solid #00b4ff',
              transition: 'width 0.2s',
            }}
          />
          {/* Waypoint ticks */}
          {[0.2, 0.38, 0.55, 0.72, 0.9].map((pct, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pct * 100}%`,
                top: 0,
                width: '1px',
                height: '100%',
                background: 'rgba(0,255,136,0.4)',
              }}
              title={
                ['Gibraltar', 'Port Said', 'Djibouti', 'Colombo', 'Singapore'][
                  i
                ]
              }
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '3px',
          }}
        >
          {['GIB', 'PSD', 'DJI', 'CMB', 'SGP'].map((wp) => (
            <span
              key={wp}
              style={{
                fontFamily: 'Rajdhani',
                fontSize: '9px',
                color: '#2a5070',
              }}
            >
              {wp}
            </span>
          ))}
        </div>
      </div>

      {/* Weather fuel warning */}
      {waveH !== null && waveH > 3.0 && (
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(255,100,0,0.1)',
            border: '1px solid rgba(255,100,0,0.3)',
            borderRadius: '3px',
            fontFamily: 'Rajdhani',
            fontSize: '12px',
            color: '#ff8844',
          }}
        >
          ⚠ Wave heights {waveH.toFixed(1)}m at departure — estimated +
          {((weatherFuelMultiplier - 1) * 100).toFixed(0)}% fuel burn penalty.
          Consider departing on Day{' '}
          {chartData.reduce(
            (best, h, i) => (h < chartData[best] ? i : best),
            0
          )}{' '}
          for optimal conditions.
        </div>
      )}
    </div>
  );
}
