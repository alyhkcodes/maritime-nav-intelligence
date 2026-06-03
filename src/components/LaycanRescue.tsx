type Props = { eta: Date };

export default function LaycanRescue({ eta }: Props) {
  const laycanEnd = new Date();
  laycanEnd.setDate(laycanEnd.getDate() + 9);
  const lateHours = (eta.getTime() - laycanEnd.getTime()) / (1000 * 60 * 60);
  const atRisk = lateHours > 0;
  const color = atRisk ? '#ff3366' : '#00ff88';

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        {[
          { label: 'LAYCAN END', value: laycanEnd.toLocaleDateString() },
          { label: 'VESSEL ETA', value: eta.toLocaleDateString() },
          { label: 'STATUS', value: atRisk ? 'AT RISK' : 'ON SCHEDULE' },
          {
            label: 'VARIANCE',
            value: atRisk ? `+${lateHours.toFixed(1)}H` : 'WITHIN WINDOW',
          },
        ].map((r) => (
          <div
            key={r.label}
            style={{
              padding: '12px 14px',
              background: 'rgba(4,20,40,0.8)',
              border: '1px solid rgba(0,180,255,0.15)',
              borderRadius: '2px',
            }}
          >
            <div
              style={{
                fontFamily: 'Orbitron',
                fontSize: '9px',
                letterSpacing: '0.2em',
                color: '#3a6a8a',
                marginBottom: '6px',
              }}
            >
              {r.label}
            </div>
            <div
              style={{
                fontFamily: 'Share Tech Mono',
                fontSize: '14px',
                color:
                  r.label === 'STATUS' || r.label === 'VARIANCE'
                    ? color
                    : '#00ffea',
              }}
            >
              {r.value}
            </div>
          </div>
        ))}
      </div>
      {atRisk ? (
        <div
          style={{
            padding: '14px 16px',
            background: '#ff336610',
            border: '1px solid #ff336630',
            borderLeft: '3px solid #ff3366',
            borderRadius: '2px',
          }}
        >
          <div
            style={{
              fontFamily: 'Orbitron',
              fontSize: '9px',
              letterSpacing: '0.2em',
              color: '#ff3366',
              marginBottom: '10px',
            }}
          >
            RECOVERY ACTIONS REQUIRED
          </div>
          {[
            'Increase speed by 8% on first voyage leg',
            'Estimated time saving: 4–6 hours',
            'Additional fuel cost: ~$8,000',
            'Switch to weather-optimized Route C',
          ].map((a) => (
            <div
              key={a}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  background: '#ff3366',
                  borderRadius: '50%',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'Rajdhani',
                  fontSize: '14px',
                  color: '#e0f4ff',
                }}
              >
                {a}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: '14px 16px',
            background: '#00ff8810',
            border: '1px solid #00ff8830',
            borderLeft: '3px solid #00ff88',
            borderRadius: '2px',
          }}
        >
          <div
            style={{
              fontFamily: 'Orbitron',
              fontSize: '9px',
              letterSpacing: '0.2em',
              color: '#00ff88',
              marginBottom: '6px',
            }}
          >
            LAYCAN WINDOW SECURE
          </div>
          <div
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '14px',
              color: '#e0f4ff',
            }}
          >
            Vessel is safely within laycan window. No intervention required.
          </div>
        </div>
      )}
    </div>
  );
}
