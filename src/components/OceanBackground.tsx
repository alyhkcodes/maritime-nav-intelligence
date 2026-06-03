export default function OceanBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        background: 'linear-gradient(180deg, #021024, #063970, #0a4d68)',
        overflow: 'hidden',
      }}
    >
      {/* Animated wave layers */}
      <div className="wave wave1" />
      <div className="wave wave2" />
      <div className="wave wave3" />

      <style>{`
        .wave {
          position: absolute;
          width: 200%;
          height: 200px;
          bottom: 0;
          left: -50%;
          background: rgba(255,255,255,0.05);
          border-radius: 40%;
          animation: waveMove 12s infinite linear;
        }

        .wave1 {
          animation-duration: 12s;
          opacity: 0.4;
        }

        .wave2 {
          animation-duration: 18s;
          opacity: 0.3;
          bottom: 20px;
        }

        .wave3 {
          animation-duration: 25s;
          opacity: 0.2;
          bottom: 40px;
        }

        @keyframes waveMove {
          0% { transform: translateX(0) rotate(0deg); }
          100% { transform: translateX(50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
