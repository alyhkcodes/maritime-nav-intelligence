import { useEffect, useRef, useState } from 'react';

type Point = { lat: number; lon: number };

export interface LiveVessel {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  sog: number;
  cog: number;
  type: string;
  timestamp: string;
}

type Props = {
  route: Point[];
  onVesselsUpdate?: (vessels: LiveVessel[]) => void;
};

const AIS_API_KEY = import.meta.env.VITE_AIS_API_KEY ?? '';

const SHIP_TYPES: Record<number, string> = {
  70: 'Cargo',
  71: 'Cargo',
  72: 'Cargo',
  73: 'Cargo',
  74: 'Cargo',
  80: 'Tanker',
  81: 'Tanker',
  82: 'Tanker',
  83: 'Tanker',
  84: 'Tanker',
  60: 'Passenger',
  69: 'Passenger',
  30: 'Fishing',
  52: 'Tug',
  37: 'Pleasure',
};

function getShipType(code: number): string {
  if (!code || code === 0) return 'Vessel';
  return SHIP_TYPES[code] ?? SHIP_TYPES[Math.floor(code / 10) * 10] ?? 'Vessel';
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function vesselTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t === 'tanker') return '#ff8844';
  if (t === 'cargo') return '#44aaff';
  if (t === 'passenger') return '#ff44aa';
  if (t === 'fishing') return '#88ff44';
  if (t === 'tug') return '#ffdd00';
  return '#aaddff';
}

function useAISStream(
  boundingBoxes: number[][][],
  onVesselsUpdate?: (vessels: LiveVessel[]) => void
) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vesselsMapRef = useRef<Map<string, LiveVessel>>(new Map());
  const [vesselList, setVesselList] = useState<LiveVessel[]>([]);
  const onUpdateRef = useRef(onVesselsUpdate);
  useEffect(() => {
    onUpdateRef.current = onVesselsUpdate;
  }, [onVesselsUpdate]);

  useEffect(() => {
    if (!AIS_API_KEY) {
      setError('No API key — add VITE_AIS_API_KEY to .env');
      return;
    }
    // Disable in StackBlitz sandbox — WebSocket is blocked anyway
    const isStackBlitz =
      window.location.hostname.includes('webcontainer') ||
      window.location.hostname.includes('stackblitz');
    if (isStackBlitz) {
      setError('AIS stream disabled in sandbox environment');
      return;
    }

    let reconnectTimer: ReturnType<typeof setTimeout>;
    let attempts = 0;

    function connect() {
      const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        ws.send(
          JSON.stringify({
            APIKey: AIS_API_KEY,
            BoundingBoxes: boundingBoxes,
            FilterMessageTypes: ['PositionReport'],
          })
        );
      };

      ws.onmessage = async (event) => {
        try {
          const text =
            event.data instanceof Blob ? await event.data.text() : event.data;
          const data = JSON.parse(text);
          if (data.MessageType !== 'PositionReport') return;

          const meta = data.MetaData;
          const pos = data.Message?.PositionReport;
          if (!pos || !meta) return;

          const mmsi = String(meta.MMSI);
          if (!mmsi || mmsi === '0') return;

          const vessel: LiveVessel = {
            mmsi,
            name: (meta.ShipName?.trim() || `MMSI-${mmsi}`).replace(/\0/g, ''),
            lat: meta.latitude,
            lon: meta.longitude,
            sog: +(pos.Sog ?? 0).toFixed(1),
            cog: +(pos.Cog ?? 0).toFixed(0),
            type: getShipType(meta.ShipType ?? pos.ShipType ?? 0),
            timestamp: meta.time_utc,
          };

          vesselsMapRef.current.set(mmsi, vessel);
          if (vesselsMapRef.current.size > 80) {
            const firstKey = vesselsMapRef.current.keys().next().value;
            if (firstKey) vesselsMapRef.current.delete(firstKey);
          }

          // Deduplicate by mmsi before setting state
          const unique = Array.from(
            new Map(
              Array.from(vesselsMapRef.current.values()).map((v) => [v.mmsi, v])
            ).values()
          );

          onUpdateRef.current?.(unique);
          setVesselList(unique);
        } catch {
          /* ignore parse errors */
        }
      };

      ws.onerror = () => setError('AIS stream unavailable in sandbox');
      ws.onclose = () => {
        setConnected(false);
        attempts += 1;
        if (attempts < 3) {
          reconnectTimer = setTimeout(connect, 8000);
        } else {
          setError('AIS stream blocked by sandbox — showing simulated data');
        }
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { vessels: vesselList, connected, error };
}

export default function MultiShipAIS({ route, onVesselsUpdate }: Props) {
  const midpoint = route[Math.floor(route.length / 2)] ?? { lat: 5, lon: 90 };

  const boundingBoxes: number[][][] = [
    [
      [49.0, 3.0],
      [52.0, 6.0],
    ],
    [
      [35.5, -6.0],
      [37.0, -4.5],
    ],
    [
      [30.5, 31.5],
      [32.0, 33.0],
    ],
    [
      [11.0, 43.0],
      [14.0, 46.0],
    ],
    [
      [1.0, 103.0],
      [6.0, 105.5],
    ],
    [
      [10.0, 55.0],
      [18.0, 65.0],
    ],
    [
      [3.0, 72.0],
      [10.0, 82.0],
    ],
  ];

  const { vessels, connected, error } = useAISStream(
    boundingBoxes,
    onVesselsUpdate
  );

  const nearby = vessels
    .map((v) => ({
      ...v,
      distKm: haversineKm(midpoint.lat, midpoint.lon, v.lat, v.lon),
    }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, 8);

  const statusColor = connected ? '#00ff88' : error ? '#ff4444' : '#ffaa00';
  const statusLabel = connected
    ? `LIVE · ${vessels.length} vessel${vessels.length !== 1 ? 's' : ''}`
    : error ?? 'CONNECTING…';

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: '9px',
            letterSpacing: '0.2em',
            color: '#3a6a8a',
          }}
        >
          📡 NEARBY AIS VESSELS
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'Share Tech Mono',
            fontSize: '9px',
            color: statusColor,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: connected ? `0 0 6px ${statusColor}` : 'none',
              animation: connected ? 'pulse 1.4s ease-in-out infinite' : 'none',
            }}
          />
          {statusLabel}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '6px' }}>
        {nearby.length === 0 && (
          <div
            style={{
              fontFamily: 'Share Tech Mono',
              fontSize: '11px',
              color: '#3a6a8a',
              padding: '12px',
              textAlign: 'center',
              border: '1px solid rgba(0,180,255,0.08)',
              borderRadius: 2,
            }}
          >
            {connected ? 'Waiting for vessel data…' : 'Establishing AIS link…'}
          </div>
        )}

        {nearby.map((ship) => {
          const color = vesselTypeColor(ship.type);
          return (
            <div
              key={ship.mmsi}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                background: 'rgba(4,20,40,0.8)',
                border: `1px solid rgba(0,180,255,0.12)`,
                borderLeft: `2px solid ${color}40`,
                borderRadius: '2px',
              }}
            >
              <div>
                <span
                  style={{
                    fontFamily: 'Rajdhani',
                    fontWeight: 600,
                    fontSize: '14px',
                    color,
                  }}
                >
                  🚢 {ship.name}{' '}
                  <span style={{ color: '#3a6a8a', fontWeight: 400 }}>
                    ({ship.type})
                  </span>
                </span>
                <div
                  style={{
                    fontFamily: 'Share Tech Mono',
                    fontSize: '9px',
                    color: '#3a6a8a',
                    marginTop: 1,
                  }}
                >
                  COG {ship.cog}° · {ship.distKm.toFixed(1)} km away · MMSI{' '}
                  {ship.mmsi}
                </div>
              </div>
              <span
                style={{
                  fontFamily: 'Share Tech Mono',
                  fontSize: '11px',
                  color: '#7ab8d4',
                  textAlign: 'right',
                }}
              >
                {ship.lat.toFixed(2)}°{ship.lat >= 0 ? 'N' : 'S'} ·{' '}
                {ship.lon.toFixed(2)}°{ship.lon >= 0 ? 'E' : 'W'}
                <br />
                {ship.sog} kn
              </span>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
