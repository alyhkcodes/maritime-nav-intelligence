export default function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(180deg, #020617, #0f172a)',
        color: 'white',
        textAlign: 'center',
        padding: 20,
      }}
    >
      <h1 style={{ fontSize: 40, marginBottom: 10 }}>
        🚢 Maritime Voyage Intelligence System
      </h1>

      <p style={{ maxWidth: 600, opacity: 0.8 }}>
        AI-powered voyage planning, weather routing, storm prediction, and fleet
        simulation platform for modern maritime operations.
      </p>

      <div
        style={{
          marginTop: 30,
          padding: 20,
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        <p>🌊 Weather-aware routing</p>
        <p>🧠 AI Captain decision system</p>
        <p>📡 Live AIS ship simulation</p>
        <p>🧭 Auto route optimization engine</p>
      </div>

      <button
        onClick={onStart}
        style={{
          marginTop: 30,
          padding: '12px 24px',
          fontSize: 16,
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          background: '#22c55e',
          color: 'black',
          fontWeight: 'bold',
        }}
      >
        Start Simulation
      </button>
    </div>
  );
}
