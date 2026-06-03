import { useState } from 'react';
import { saveUser } from '../utils/auth';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  function handle() {
    if (user === 'admin' && pass === 'admin') {
      saveUser(user);
      onLogin();
    } else {
      setError('ACCESS DENIED — INVALID CREDENTIALS');
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(4,20,40,0.8)',
    border: '1px solid rgba(0,180,255,0.2)',
    borderRadius: '2px',
    color: '#e0f4ff',
    fontFamily: 'Share Tech Mono, monospace',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '12px',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020b18',
        backgroundImage:
          'radial-gradient(ellipse at 50% 50%, #041428 0%, #020b18 70%)',
      }}
    >
      <div
        style={{
          width: '380px',
          padding: '48px',
          background: 'rgba(6,32,64,0.6)',
          border: '1px solid rgba(0,180,255,0.15)',
          borderTop: '2px solid #00b4ff',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚓</div>
          <div
            style={{
              fontFamily: 'Orbitron',
              fontSize: '13px',
              letterSpacing: '0.3em',
              color: '#00b4ff',
            }}
          >
            MARITIME NAV SYSTEM
          </div>
          <div
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '11px',
              letterSpacing: '0.2em',
              color: '#3a6a8a',
              marginTop: '4px',
            }}
          >
            RESTRICTED ACCESS — AUTHENTICATE
          </div>
        </div>
        <input
          style={inputStyle}
          placeholder="OPERATOR ID"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <input
          style={inputStyle}
          placeholder="ACCESS CODE"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handle()}
        />
        {error && (
          <div
            style={{
              color: '#ff3366',
              fontFamily: 'Share Tech Mono',
              fontSize: '11px',
              marginBottom: '12px',
              letterSpacing: '0.1em',
            }}
          >
            {error}
          </div>
        )}
        <button
          onClick={handle}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #00b4ff20, #00ffea10)',
            border: '1px solid #00b4ff',
            color: '#00b4ff',
            fontFamily: 'Orbitron',
            fontSize: '11px',
            letterSpacing: '0.2em',
            borderRadius: '2px',
            transition: 'all 0.2s',
          }}
        >
          AUTHENTICATE
        </button>
        <div
          style={{
            textAlign: 'center',
            marginTop: '16px',
            fontFamily: 'Share Tech Mono',
            fontSize: '10px',
            color: '#3a6a8a',
          }}
        >
          demo: admin / admin
        </div>
      </div>
    </div>
  );
}
