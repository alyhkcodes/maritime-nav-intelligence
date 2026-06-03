type Props = { waveHeight: number | null };

export default function WeatherRiskBanner({ waveHeight }: Props) {
  if (waveHeight === null) return null;
  const risk =
    waveHeight > 4 ? 'CRITICAL' : waveHeight > 2.5 ? 'ELEVATED' : 'NOMINAL';
  const color =
    risk === 'CRITICAL'
      ? '#ff3366'
      : risk === 'ELEVATED'
      ? '#ffaa00'
      : '#00ff88';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        marginBottom: '16px',
        background: `${color}10`,
        border: `1px solid ${color}40`,
        borderRadius: '2px',
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 12px ${color}`,
          animation: risk !== 'NOMINAL' ? 'pulse 1s infinite' : 'none',
        }}
      />
      <span
        style={{
          fontFamily: 'Orbitron',
          fontSize: '10px',
          letterSpacing: '0.15em',
          color,
        }}
      >
        SEA STATE: {risk}
      </span>
      <span
        style={{
          fontFamily: 'Share Tech Mono',
          fontSize: '12px',
          color: '#7ab8d4',
          marginLeft: 'auto',
        }}
      >
        WAVE HT: {waveHeight}M
      </span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
