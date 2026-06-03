import { clearUser } from '../utils/auth';

export default function LogoutButton({ onLogout }: { onLogout: () => void }) {
  function handle() {
    clearUser();
    onLogout();
  }

  return (
    <button
      onClick={handle}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 1000,
        padding: '8px 16px',
        background: 'rgba(255,51,102,0.1)',
        border: '1px solid rgba(255,51,102,0.4)',
        color: '#ff3366',
        fontFamily: 'Orbitron',
        fontSize: '9px',
        letterSpacing: '0.2em',
        borderRadius: '2px',
      }}
    >
      DISCONNECT
    </button>
  );
}
