import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Props = { weatherData: { waveHeight?: number }[] };

const tooltipStyle = {
  backgroundColor: 'rgba(4,20,40,0.95)',
  border: '1px solid rgba(0,180,255,0.2)',
  borderRadius: '2px',
  fontFamily: 'Share Tech Mono',
  fontSize: '12px',
  color: '#00ffea',
};

export default function VoyageCharts({ weatherData }: Props) {
  const waveData = weatherData.map((d, i) => ({
    name: `WP${i + 1}`,
    wave: d.waveHeight ?? 0,
  }));

  const fuelData = weatherData.map((d, i) => ({
    name: `WP${i + 1}`,
    fuel: Math.round(45 * (1 + (d.waveHeight ?? 0) * 0.05)),
  }));

  const STW = 12.0;
  const legData = weatherData.map((d, i) => {
    const wave = d.waveHeight ?? 0;
    const sogPenalty = Math.min(wave * 0.35, 2.8);
    const sog = parseFloat((STW - sogPenalty).toFixed(1));
    const delayHrs = parseFloat((sogPenalty * 2.2).toFixed(1));
    return {
      name: `WP${i + 1}`,
      STW,
      SOG: sog,
      delay: delayHrs,
      wave: parseFloat(wave.toFixed(1)),
    };
  });

  const axisStyle = {
    fontFamily: 'Share Tech Mono',
    fontSize: 10,
    fill: '#3a6a8a',
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Wave Height */}
      <div>
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: '#00b4ff',
            marginBottom: '14px',
          }}
        >
          WAVE HEIGHT (M)
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={waveData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,180,255,0.08)"
            />
            <XAxis
              dataKey="name"
              tick={axisStyle}
              axisLine={{ stroke: 'rgba(0,180,255,0.15)' }}
              tickLine={false}
            />
            <YAxis
              tick={axisStyle}
              axisLine={{ stroke: 'rgba(0,180,255,0.15)' }}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="wave"
              stroke="#00ffea"
              strokeWidth={2}
              dot={{ fill: '#00ffea', r: 4, strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: '#00ffea',
                boxShadow: '0 0 10px #00ffea',
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fuel Consumption */}
      <div>
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: '#ffaa00',
            marginBottom: '14px',
          }}
        >
          FUEL CONSUMPTION (T/DAY)
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={fuelData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(0,180,255,0.08)"
            />
            <XAxis
              dataKey="name"
              tick={axisStyle}
              axisLine={{ stroke: 'rgba(0,180,255,0.15)' }}
              tickLine={false}
            />
            <YAxis
              tick={axisStyle}
              axisLine={{ stroke: 'rgba(0,180,255,0.15)' }}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey="fuel"
              fill="#ffaa00"
              opacity={0.8}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* SOG vs STW Table */}
      <div>
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: '#00ff88',
            marginBottom: '10px',
          }}
        >
          SOG vs STW — SPEED LOSS PER LEG
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'Share Tech Mono',
              fontSize: '11px',
            }}
          >
            <thead>
              <tr>
                {['LEG', 'WAVE (M)', 'STW (KN)', 'SOG (KN)', 'DELAY (H)'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '5px 8px',
                        color: '#3a6a8a',
                        fontWeight: 400,
                        textAlign: 'left',
                        borderBottom: '1px solid rgba(0,180,255,0.12)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {legData.map((row, i) => {
                const bad = row.wave > 2.5;
                return (
                  <tr
                    key={i}
                    style={{
                      background: bad ? 'rgba(255,100,0,0.05)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '5px 8px', color: '#00b4ff' }}>
                      {row.name}
                    </td>
                    <td
                      style={{
                        padding: '5px 8px',
                        color: bad ? '#ff8844' : '#6ab4d0',
                      }}
                    >
                      {row.wave.toFixed(1)}
                    </td>
                    <td style={{ padding: '5px 8px', color: '#88ccee' }}>
                      {row.STW.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '5px 8px',
                        color: bad ? '#ff6644' : '#00ff88',
                      }}
                    >
                      {row.SOG.toFixed(1)}
                    </td>
                    <td
                      style={{
                        padding: '5px 8px',
                        color: row.delay > 2 ? '#ff8844' : '#5a9ab8',
                      }}
                    >
                      {row.delay > 0 ? `+${row.delay.toFixed(1)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          style={{
            marginTop: '8px',
            fontFamily: 'Rajdhani',
            fontSize: '11px',
            color: '#3a6a8a',
          }}
        >
          STW = commanded speed through water · SOG = effective speed over
          ground
        </div>
      </div>
    </div>
  );
}
