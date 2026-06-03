import { useEffect, useState, useRef } from 'react';

export type Toast = {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
};

let addToastFn:
  | ((msg: string, type: Toast['type'], title?: string) => void)
  | null = null;

export function toast(
  message: string,
  type: Toast['type'] = 'info',
  title?: string
) {
  addToastFn?.(message, type, title);
}

// Auto-fire maritime alerts for demo realism
const MARITIME_ALERTS: {
  delay: number;
  msg: string;
  type: Toast['type'];
  title: string;
}[] = [
  {
    delay: 8000,
    type: 'warning',
    title: 'WEATHER ALERT',
    msg: 'Tropical depression forming near Arabian Sea — monitor route WP3→WP4',
  },
  {
    delay: 22000,
    type: 'error',
    title: 'PIRACY ALERT',
    msg: 'IMB reports incident at 11°N 45°E — Gulf of Aden active threat zone',
  },
  {
    delay: 38000,
    type: 'info',
    title: 'PORT UPDATE',
    msg: 'Singapore PSA: berth 32A available. Estimated wait time reduced to 4h',
  },
  {
    delay: 55000,
    type: 'warning',
    title: 'FUEL ADVISORY',
    msg: 'HFO prices up 3.2% at Port Said — consider bunkering at Djibouti',
  },
  {
    delay: 75000,
    type: 'success',
    title: 'ROUTE CLEARED',
    msg: 'Suez Canal transit slot confirmed: 0600 UTC +2 days',
  },
  {
    delay: 95000,
    type: 'info',
    title: 'AIS CONTACT',
    msg: 'MAERSK TITAN now 12 NM ahead on same route — maintain separation',
  },
  {
    delay: 118000,
    type: 'error',
    title: 'SEA STATE',
    msg: 'Beaufort 7 forecast at Bab-el-Mandeb Strait in 36h — route review advised',
  },
  {
    delay: 145000,
    type: 'success',
    title: 'CII UPDATED',
    msg: 'Carbon intensity rating improved to Grade B after speed optimization',
  },
];

export default function ToastManager() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    addToastFn = (message, type, title) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type, title }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        5500
      );
    };

    // Schedule auto maritime alerts
    MARITIME_ALERTS.forEach(({ delay, msg, type, title }) => {
      const t = setTimeout(() => {
        addToastFn?.(msg, type, title);
      }, delay);
      timersRef.current.push(t);
    });

    return () => {
      addToastFn = null;
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const removeToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const colors = {
    info: '#00b4ff',
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff3366',
  };

  const icons = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '⚡',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '340px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          style={{
            padding: '10px 14px',
            background: 'rgba(4,20,40,0.97)',
            border: `1px solid ${colors[t.type]}30`,
            borderLeft: `3px solid ${colors[t.type]}`,
            borderRadius: '2px',
            backdropFilter: 'blur(16px)',
            boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 20px ${
              colors[t.type]
            }15`,
            animation: 'toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            cursor: 'pointer',
            pointerEvents: 'all',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: `${colors[t.type]}20`,
              border: `1px solid ${colors[t.type]}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: colors[t.type],
              flexShrink: 0,
              boxShadow: `0 0 8px ${colors[t.type]}40`,
              fontWeight: 700,
            }}
          >
            {icons[t.type]}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {t.title && (
              <div
                style={{
                  fontFamily: 'Orbitron',
                  fontSize: '9px',
                  color: colors[t.type],
                  letterSpacing: '0.15em',
                  marginBottom: '3px',
                }}
              >
                {t.title}
              </div>
            )}
            <div
              style={{
                fontFamily: 'Rajdhani',
                fontSize: '13px',
                color: '#c0dcf0',
                lineHeight: 1.4,
              }}
            >
              {t.message}
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 3,
              right: 0,
              height: 2,
              background: `${colors[t.type]}20`,
              borderRadius: '0 0 2px 2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: colors[t.type],
                animation: 'toastProgress 5.5s linear forwards',
                transformOrigin: 'left',
              }}
            />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(30px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
