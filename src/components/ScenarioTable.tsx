type Scenario = { name: string; hours: number; fuel: number; cost: number };

export default function ScenarioTable({
  scenarios,
}: {
  scenarios: Scenario[];
}) {
  const best = [...scenarios].sort((a, b) => a.cost - b.cost)[0];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Rajdhani',
        }}
      >
        <thead>
          <tr>
            {['ROUTE', 'DURATION', 'FUEL LOAD', 'TOTAL COST', 'STATUS'].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontFamily: 'Orbitron',
                    fontSize: '9px',
                    letterSpacing: '0.2em',
                    color: '#3a6a8a',
                    borderBottom: '1px solid rgba(0,180,255,0.15)',
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => {
            const isBest = s.name === best.name;
            return (
              <tr
                key={s.name}
                style={{ borderBottom: '1px solid rgba(0,180,255,0.06)' }}
              >
                <td
                  style={{
                    padding: '14px 16px',
                    color: isBest ? '#00ffea' : '#e0f4ff',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  {s.name}
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    fontFamily: 'Share Tech Mono',
                    fontSize: '13px',
                    color: '#7ab8d4',
                  }}
                >
                  {s.hours.toFixed(1)}h
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    fontFamily: 'Share Tech Mono',
                    fontSize: '13px',
                    color: '#7ab8d4',
                  }}
                >
                  {s.fuel.toFixed(1)}T
                </td>
                <td
                  style={{
                    padding: '14px 16px',
                    fontFamily: 'Share Tech Mono',
                    fontSize: '13px',
                    color: isBest ? '#00ff88' : '#7ab8d4',
                  }}
                >
                  ${s.cost.toFixed(0)}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '2px',
                      fontSize: '10px',
                      fontFamily: 'Orbitron',
                      letterSpacing: '0.1em',
                      background: isBest
                        ? 'rgba(0,255,136,0.1)'
                        : 'rgba(0,180,255,0.08)',
                      border: `1px solid ${
                        isBest ? '#00ff88' : 'rgba(0,180,255,0.2)'
                      }`,
                      color: isBest ? '#00ff88' : '#7ab8d4',
                    }}
                  >
                    {isBest ? 'OPTIMAL' : 'AVAILABLE'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
