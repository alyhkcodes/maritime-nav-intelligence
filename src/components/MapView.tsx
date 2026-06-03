import { useState, useEffect, useRef } from 'react';

type Point = { lat: number; lon: number };

export interface LiveVessel {
  mmsi: string;
  name: string;
  lat: number;
  lon: number;
  sog: number;
  cog: number;
  type: string;
}

type Props = { route?: Point[]; liveVessels?: LiveVessel[] };

const FALLBACK: Point[] = [
  { lat: 51.9, lon: 4.5 },
  { lat: 36.1, lon: -5.3 },
  { lat: 31.2, lon: 32.3 },
  { lat: 12.8, lon: 45.0 },
  { lat: 1.29, lon: 103.85 },
];

const PIRACY_ZONES = [
  {
    name: 'Gulf of Aden',
    lat: 12.5,
    lon: 47.0,
    radiusDeg: 3.5,
    risk: 'HIGH',
    color: '#ff3366',
  },
  {
    name: 'Somali Basin',
    lat: 8.0,
    lon: 52.0,
    radiusDeg: 5.0,
    risk: 'HIGH',
    color: '#ff3366',
  },
  {
    name: 'Gulf of Guinea',
    lat: 4.0,
    lon: 3.5,
    radiusDeg: 6.0,
    risk: 'HIGH',
    color: '#ff3366',
  },
  {
    name: 'Malacca Strait',
    lat: 3.5,
    lon: 102.0,
    radiusDeg: 2.5,
    risk: 'MEDIUM',
    color: '#ffaa00',
  },
  {
    name: 'Bangladesh Coast',
    lat: 22.0,
    lon: 91.5,
    radiusDeg: 2.0,
    risk: 'MEDIUM',
    color: '#ffaa00',
  },
  {
    name: 'Peru/Ecuador',
    lat: -5.0,
    lon: -82.0,
    radiusDeg: 3.0,
    risk: 'LOW',
    color: '#ffdd00',
  },
  {
    name: 'Philippine Sea',
    lat: 10.0,
    lon: 122.0,
    radiusDeg: 3.0,
    risk: 'MEDIUM',
    color: '#ffaa00',
  },
];

// Storm zones (ECA / high gale risk)
const STORM_ZONES = [
  {
    name: 'Bay of Biscay',
    lat: 45.5,
    lon: -5.0,
    radiusDeg: 4.0,
    risk: 'HIGH GALE',
    color: '#ff6600',
  },
  {
    name: 'North Atlantic',
    lat: 52.0,
    lon: -20.0,
    radiusDeg: 6.0,
    risk: 'HIGH GALE',
    color: '#ff6600',
  },
  {
    name: 'Arabian Sea',
    lat: 15.0,
    lon: 63.0,
    radiusDeg: 4.5,
    risk: 'CAUTION',
    color: '#ffcc00',
  },
  {
    name: 'SW Monsoon Zone',
    lat: 10.0,
    lon: 75.0,
    radiusDeg: 5.0,
    risk: 'MONSOON',
    color: '#ff9900',
  },
  {
    name: 'Caution Zone',
    lat: 7.0,
    lon: 65.0,
    radiusDeg: 3.5,
    risk: 'CAUTION',
    color: '#ffcc00',
  },
  {
    name: 'ECA Zone',
    lat: 55.0,
    lon: 10.0,
    radiusDeg: 4.0,
    risk: 'ECA',
    color: '#00ccff',
  },
];

// Suggested detour waypoints (bypass Gulf of Aden south)
const DETOUR_PTS: Point[] = [
  { lat: 12.8, lon: 45.0 },
  { lat: 5.0, lon: 50.0 },
  { lat: -5.0, lon: 55.0 },
  { lat: 1.29, lon: 103.85 },
];

// Wind particles
type WindParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  alpha: number;
};

function vesselColor(type: string): string {
  const t = type.toLowerCase();
  if (t === 'tanker') return '#ff8844';
  if (t === 'cargo') return '#44aaff';
  if (t === 'passenger') return '#ff44aa';
  if (t === 'fishing') return '#88ff44';
  if (t === 'tug') return '#ffdd00';
  return '#aaddff';
}

function latToY(lat: number): number {
  const rad = (lat * Math.PI) / 180;
  return (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function mercatorProject(
  lat: number,
  lon: number,
  viewLat: number,
  viewLon: number,
  zoom: number,
  w: number,
  h: number
): [number, number] {
  const scale = zoom * (w / 360);
  const x = (lon - viewLon) * scale + w / 2;
  const cy = latToY(viewLat);
  const y = -(latToY(lat) - cy) * scale + h / 2;
  return [x, y];
}

// Simulate wind field: returns [u, v] wind vector at a screen point
function windField(
  px: number,
  py: number,
  W: number,
  H: number,
  t: number
): [number, number] {
  const nx = px / W;
  const ny = py / H;
  const u =
    Math.sin(ny * Math.PI * 2.5 + t * 0.0003) * 1.2 +
    Math.cos(nx * Math.PI * 1.8 + t * 0.0002) * 0.6;
  const vy =
    Math.cos(nx * Math.PI * 2.0 + t * 0.00025) * 1.0 +
    Math.sin(ny * Math.PI * 1.5 + t * 0.0003) * 0.5;
  return [u, vy];
}

export default function MapView({ route, liveVessels = [] }: Props) {
  const pts = route && route.length >= 2 ? route : FALLBACK;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(2.2);
  const [viewLat, setViewLat] = useState(20);
  const [viewLon, setViewLon] = useState(45);
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  // Layer toggles
  const [showPiracy, setShowPiracy] = useState(true);
  const [showStorms, setShowStorms] = useState(true);
  const [showVessels, setShowVessels] = useState(true);
  const [showWindFlow, setShowWindFlow] = useState(true);
  const [showDetour, setShowDetour] = useState(true);

  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [hoveredVessel, setHoveredVessel] = useState<LiveVessel | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const animRef = useRef(0);
  const particlesRef = useRef<WindParticle[]>([]);

  // Stable refs for draw loop
  const liveVesselsRef = useRef(liveVessels);
  const zoomRef = useRef(zoom);
  const viewLatRef = useRef(viewLat);
  const viewLonRef = useRef(viewLon);
  const showPiracyRef = useRef(showPiracy);
  const showStormsRef = useRef(showStorms);
  const showVesselsRef = useRef(showVessels);
  const showWindRef = useRef(showWindFlow);
  const showDetourRef = useRef(showDetour);
  const hoveredZoneRef = useRef(hoveredZone);
  const hoveredVesselRef = useRef(hoveredVessel);
  const ptsRef = useRef(pts);

  useEffect(() => {
    liveVesselsRef.current = liveVessels;
  }, [liveVessels]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    viewLatRef.current = viewLat;
  }, [viewLat]);
  useEffect(() => {
    viewLonRef.current = viewLon;
  }, [viewLon]);
  useEffect(() => {
    showPiracyRef.current = showPiracy;
  }, [showPiracy]);
  useEffect(() => {
    showStormsRef.current = showStorms;
  }, [showStorms]);
  useEffect(() => {
    showVesselsRef.current = showVessels;
  }, [showVessels]);
  useEffect(() => {
    showWindRef.current = showWindFlow;
  }, [showWindFlow]);
  useEffect(() => {
    showDetourRef.current = showDetour;
  }, [showDetour]);
  useEffect(() => {
    hoveredZoneRef.current = hoveredZone;
  }, [hoveredZone]);
  useEffect(() => {
    hoveredVesselRef.current = hoveredVessel;
  }, [hoveredVessel]);
  useEffect(() => {
    ptsRef.current = pts;
  }, [pts]);

  // Init wind particles
  useEffect(() => {
    const arr: WindParticle[] = [];
    for (let i = 0; i < 220; i++) {
      arr.push({
        x: Math.random() * 1200,
        y: Math.random() * 540,
        vx: 0,
        vy: 0,
        age: Math.random() * 80,
        maxAge: 60 + Math.random() * 80,
        alpha: Math.random(),
      });
    }
    particlesRef.current = arr;
  }, []);

  const draw = (t = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const zoom = zoomRef.current;
    const viewLat = viewLatRef.current;
    const viewLon = viewLonRef.current;
    const currentPts = ptsRef.current;

    const proj = (lat: number, lon: number): [number, number] =>
      mercatorProject(lat, lon, viewLat, viewLon, zoom, W, H);

    ctx.clearRect(0, 0, W, H);

    // Ocean background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#020e1e');
    bg.addColorStop(1, '#041428');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,100,180,0.1)';
    ctx.lineWidth = 0.5;
    for (let lon = -180; lon <= 180; lon += 30) {
      const [x1] = proj(80, lon);
      ctx.beginPath();
      ctx.moveTo(x1, proj(80, lon)[1]);
      ctx.lineTo(x1, proj(-80, lon)[1]);
      ctx.stroke();
    }
    for (let lat = -60; lat <= 80; lat += 20) {
      ctx.beginPath();
      ctx.moveTo(0, proj(lat, viewLon - 200)[1]);
      ctx.lineTo(W, proj(lat, viewLon + 200)[1]);
      ctx.stroke();
    }

    // ── WIND FLOW ANIMATION (particles) ──
    if (showWindRef.current) {
      const particles = particlesRef.current;
      particles.forEach((p) => {
        p.age += 1;
        if (p.age > p.maxAge) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.age = 0;
          p.maxAge = 60 + Math.random() * 80;
          p.alpha = 0;
        }
        const [u, v] = windField(p.x, p.y, W, H, t);
        p.vx = p.vx * 0.85 + u * 0.15;
        p.vy = p.vy * 0.85 + v * 0.15;
        const prevX = p.x;
        const prevY = p.y;
        p.x += p.vx * 0.9;
        p.y += p.vy * 0.9;
        if (p.x < 0 || p.x > W) p.x = Math.random() * W;
        if (p.y < 0 || p.y > H) p.y = Math.random() * H;

        const lifeRatio = p.age / p.maxAge;
        const fade =
          lifeRatio < 0.15
            ? lifeRatio / 0.15
            : lifeRatio > 0.75
            ? (1 - lifeRatio) / 0.25
            : 1;
        p.alpha = fade * 0.55;

        const speed = Math.sqrt(p.vx ** 2 + p.vy ** 2);
        const c = Math.round(140 + speed * 30);
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(${Math.round(c * 0.4)},${c},${Math.min(
          255,
          c + 80
        )},${p.alpha.toFixed(2)})`;
        ctx.lineWidth = 0.9 + speed * 0.15;
        ctx.stroke();
      });

      // ── WIND BARBS GRID ──
      const GRID = 55;
      for (let gx = GRID; gx < W - 20; gx += GRID) {
        for (let gy = GRID; gy < H - 20; gy += GRID) {
          const [u, v] = windField(gx, gy, W, H, t);
          const spd = Math.sqrt(u * u + v * v);
          const angle = Math.atan2(v, u);
          const len = 10 + spd * 5;
          const alpha = 0.18 + spd * 0.1;

          ctx.save();
          ctx.translate(gx, gy);
          ctx.rotate(angle);

          // Shaft
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(len, 0);
          ctx.strokeStyle = `rgba(0,200,255,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(len, 0);
          ctx.lineTo(len - 4, -2.5);
          ctx.lineTo(len - 4, 2.5);
          ctx.closePath();
          ctx.fillStyle = `rgba(0,200,255,${alpha + 0.1})`;
          ctx.fill();

          // Speed tick marks
          if (spd > 1.0) {
            ctx.beginPath();
            ctx.moveTo(len * 0.7, 0);
            ctx.lineTo(len * 0.7 - 3, -4);
            ctx.strokeStyle = `rgba(0,200,255,${alpha * 0.8})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
          if (spd > 1.5) {
            ctx.beginPath();
            ctx.moveTo(len * 0.5, 0);
            ctx.lineTo(len * 0.5 - 3, -4);
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // Live wind badge (bottom bar)
      const windSpd = 12 + Math.round(Math.sin(t * 0.0002) * 3);
      const bx = W - 8,
        by = H - 10;
      ctx.font = 'bold 9px Rajdhani, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(2,14,30,0.82)';
      const badgeW = 160,
        badgeH = 18;
      ctx.fillRect(bx - badgeW, by - badgeH + 2, badgeW, badgeH);
      ctx.strokeStyle = 'rgba(0,180,255,0.25)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bx - badgeW, by - badgeH + 2, badgeW, badgeH);
      ctx.fillStyle = 'rgba(0,200,255,0.75)';
      ctx.fillText(
        `↻  WIND · ${windSpd}–${windSpd + 6} KTS · SW`,
        bx - 6,
        by - 2
      );
    }

    // ── STORM / WEATHER ZONES ──
    if (showStormsRef.current) {
      STORM_ZONES.forEach((zone) => {
        const [cx, cy] = proj(zone.lat, zone.lon);
        const radiusPx = zone.radiusDeg * zoom * (W / 360);
        const isHovered = hoveredZoneRef.current === zone.name;
        const pulse = Math.sin(t * 0.0018 + zone.lat) * 0.3 + 0.7;

        ctx.beginPath();
        ctx.arc(cx, cy, radiusPx * (1 + pulse * 0.06), 0, Math.PI * 2);
        ctx.strokeStyle = zone.color + (isHovered ? '80' : '40');
        ctx.lineWidth = isHovered ? 1.5 : 1;
        ctx.setLineDash(zone.risk === 'ECA' ? [6, 3] : [4, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusPx);
        grad.addColorStop(
          0,
          zone.color + (zone.risk === 'HIGH GALE' ? '28' : '18')
        );
        grad.addColorStop(1, zone.color + '00');
        ctx.beginPath();
        ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (zoom > 1.5 && cx > 0 && cx < W && cy > 20 && cy < H - 10) {
          ctx.font = `bold ${zoom > 3 ? 10 : 8}px Rajdhani, sans-serif`;
          ctx.fillStyle = zone.color + 'cc';
          ctx.textAlign = 'center';
          ctx.fillText(`⛈ ${zone.name}`, cx, cy + radiusPx * 0.45);
          if (zoom > 2.0) {
            ctx.font = '8px Rajdhani, sans-serif';
            ctx.fillStyle = zone.color + '80';
            ctx.fillText(zone.risk, cx, cy + radiusPx * 0.45 + 11);
          }
        }
      });
    }

    // ── PIRACY ZONES ──
    if (showPiracyRef.current) {
      PIRACY_ZONES.forEach((zone) => {
        const [cx, cy] = proj(zone.lat, zone.lon);
        const radiusPx = zone.radiusDeg * zoom * (W / 360);
        const isHovered = hoveredZoneRef.current === zone.name;
        const pulse = Math.sin(t * 0.002) * 0.3 + 0.7;

        ctx.beginPath();
        ctx.arc(cx, cy, radiusPx * (1 + pulse * 0.08), 0, Math.PI * 2);
        ctx.strokeStyle = zone.color + (isHovered ? '60' : '25');
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusPx);
        grad.addColorStop(0, zone.color + (zone.risk === 'HIGH' ? '30' : '20'));
        grad.addColorStop(1, zone.color + '00');
        ctx.beginPath();
        ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (zoom > 1.8 && cx > 0 && cx < W && cy > 20 && cy < H - 10) {
          ctx.font = `bold ${zoom > 3 ? 10 : 8}px Rajdhani, sans-serif`;
          ctx.fillStyle = zone.color + 'cc';
          ctx.textAlign = 'center';
          ctx.fillText(`⚠ ${zone.name}`, cx, cy + radiusPx * 0.5);
          if (zoom > 2.5) {
            ctx.font = '8px Rajdhani, sans-serif';
            ctx.fillStyle = zone.color + '80';
            ctx.fillText(zone.risk, cx, cy + radiusPx * 0.5 + 12);
          }
        }
      });
    }

    // Landmasses (simplified boxes)
    const landColor = 'rgba(20,50,40,0.7)';
    const landBorder = 'rgba(0,180,100,0.25)';
    const drawRect = (
      minLat: number,
      maxLat: number,
      minLon: number,
      maxLon: number
    ) => {
      const [x1, y2] = proj(maxLat, minLon);
      const [x2, y1] = proj(minLat, maxLon);
      ctx.fillStyle = landColor;
      ctx.strokeStyle = landBorder;
      ctx.lineWidth = 0.5;
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    };
    drawRect(36, 71, -10, 60); // Europe / Middle East
    drawRect(-35, 37, -18, 52); // Africa
    drawRect(8, 55, 25, 140); // Asia
    drawRect(-10, 10, 95, 141); // SE Asia
    drawRect(25, 50, -130, -60); // North America
    drawRect(-55, 12, -82, -35); // South America
    drawRect(-45, -10, 113, 154); // Australia

    // ── SUGGESTED DETOUR ──
    if (showDetourRef.current && DETOUR_PTS.length >= 2) {
      ctx.save();
      ctx.strokeStyle = '#ffdd00';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      DETOUR_PTS.forEach((p, i) => {
        const [x, y] = proj(p.lat, p.lon);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const midIdx = Math.floor(DETOUR_PTS.length / 2);
      const [mx, my] = proj(DETOUR_PTS[midIdx].lat, DETOUR_PTS[midIdx].lon);
      if (mx > 0 && mx < W && my > 0 && my < H) {
        ctx.font = '9px Rajdhani, sans-serif';
        ctx.fillStyle = '#ffdd00cc';
        ctx.textAlign = 'center';
        ctx.fillText('Detour +612 nm · avoids monsoon', mx, my - 10);
      }
      ctx.restore();
    }

    // ── MAIN ROUTE ──
    if (currentPts.length >= 2) {
      ctx.shadowColor = '#00b4ff';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = 'rgba(0,120,200,0.35)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      currentPts.forEach((p, i) => {
        const [x, y] = proj(p.lat, p.lon);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#00b4ff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      currentPts.forEach((p, i) => {
        const [x, y] = proj(p.lat, p.lon);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated ship on route
      const totalPts = currentPts.length - 1;
      const progress = (t * 0.0003) % 1;
      const seg = Math.floor(progress * totalPts);
      const frac = (progress * totalPts) % 1;
      if (seg < currentPts.length - 1) {
        const a = currentPts[seg];
        const b = currentPts[seg + 1];
        const animLat = a.lat + (b.lat - a.lat) * frac;
        const animLon = a.lon + (b.lon - a.lon) * frac;
        const [ax, ay] = proj(animLat, animLon);
        ctx.beginPath();
        ctx.arc(ax, ay, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#00ffea';
        ctx.shadowColor = '#00ffea';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // ── SWELL DIRECTION ARROWS along route ──
    if (showWindRef.current && currentPts.length >= 2) {
      for (let i = 0; i < currentPts.length - 1; i++) {
        const a = currentPts[i];
        const b = currentPts[i + 1];
        const midLat = (a.lat + b.lat) / 2;
        const midLon = (a.lon + b.lon) / 2;
        const [mx, my] = proj(midLat, midLon);
        if (mx < 0 || mx > W || my < 0 || my > H) continue;

        // Swell angle: simulate with position-based offset
        const swellAngle = (midLon * 3.7 + midLat * 2.1) % (Math.PI * 2);
        const swellSpd = 0.8 + Math.abs(Math.sin(midLat * 0.3)) * 1.4;
        const len = 14 + swellSpd * 5;
        const pulse = 0.6 + Math.sin(t * 0.001 + i) * 0.4;

        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(swellAngle);
        ctx.globalAlpha = pulse * 0.75;

        // Arrow shaft
        ctx.beginPath();
        ctx.moveTo(-len / 2, 0);
        ctx.lineTo(len / 2, 0);
        ctx.strokeStyle = '#00eeff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(len / 2, 0);
        ctx.lineTo(len / 2 - 5, -3);
        ctx.lineTo(len / 2 - 5, 3);
        ctx.closePath();
        ctx.fillStyle = '#00eeff';
        ctx.fill();

        // Wave height label if zoom is high enough
        if (zoom > 2.5) {
          ctx.rotate(-swellAngle);
          ctx.font = '8px Rajdhani, sans-serif';
          ctx.fillStyle = 'rgba(0,220,255,0.7)';
          ctx.textAlign = 'center';
          ctx.fillText(`${swellSpd.toFixed(1)}m`, 0, -8);
        }

        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    // Waypoints
    currentPts.forEach((p, i) => {
      const [x, y] = proj(p.lat, p.lon);
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) return;
      const isFirst = i === 0;
      const isLast = i === currentPts.length - 1;
      const color = isFirst ? '#00ff88' : isLast ? '#ff6644' : '#00b4ff';
      ctx.beginPath();
      ctx.arc(x, y, isFirst || isLast ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, isFirst || isLast ? 10 : 7, 0, Math.PI * 2);
      ctx.strokeStyle = color + '60';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (zoom > 1.5) {
        const labels = [
          'ROTTERDAM',
          'GIBRALTAR',
          'PORT SAID',
          'DJIBOUTI',
          'SINGAPORE',
        ];
        ctx.font = '9px Rajdhani, sans-serif';
        ctx.fillStyle = color + 'cc';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i] || `WP${i + 1}`, x, y - 14);
      }
    });

    // ── LIVE AIS VESSELS ──
    if (showVesselsRef.current) {
      const vessels = liveVesselsRef.current;
      vessels.forEach((v) => {
        const [vx, vy] = proj(v.lat, v.lon);
        if (vx < -10 || vx > W + 10 || vy < -10 || vy > H + 10) return;

        const color = vesselColor(v.type);
        const isHovered = hoveredVesselRef.current?.mmsi === v.mmsi;

        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate((v.cog * Math.PI) / 180);

        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = isHovered ? 16 : 8;
        ctx.fill();

        if (isHovered) {
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.strokeStyle = color + '80';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();

        if (zoom > 2.5 || isHovered) {
          ctx.font = isHovered
            ? 'bold 10px Rajdhani, sans-serif'
            : '9px Rajdhani, sans-serif';
          ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(200,230,255,0.75)';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 0;
          ctx.fillText(v.name, vx, vy + 16);
          ctx.fillStyle = 'rgba(100,180,210,0.6)';
          ctx.fillText(`${v.sog} kn`, vx, vy + 26);
        }
      });
    }

    // Compass rose
    const cx2 = W - 40,
      cy2 = H - 40;
    ctx.font = 'bold 9px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    [
      ['N', 0, -18],
      ['S', 0, 22],
      ['E', 18, 6],
      ['W', -18, 6],
    ].forEach(([dir, dx, dy]) => {
      ctx.fillStyle = dir === 'N' ? '#ff4444' : 'rgba(0,180,255,0.6)';
      ctx.fillText(dir as string, cx2 + (dx as number), cy2 + (dy as number));
    });
    ctx.beginPath();
    ctx.arc(cx2, cy2, 12, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,180,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Scale bar
    ctx.fillStyle = 'rgba(0,180,255,0.5)';
    ctx.fillRect(16, H - 24, 60, 2);
    ctx.font = '8px Rajdhani, sans-serif';
    ctx.fillStyle = 'rgba(0,180,255,0.6)';
    ctx.textAlign = 'left';
    const nmPerPixel = 60 / zoom / (W / 360);
    ctx.fillText(`≈ ${Math.round(60 * nmPerPixel)} NM`, 16, H - 28);

    animRef.current = requestAnimationFrame((ts) => draw(ts));
  };

  useEffect(() => {
    animRef.current = requestAnimationFrame((ts) => draw(ts));
    return () => cancelAnimationFrame(animRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) =>
      Math.max(0.8, Math.min(12, z * (e.deltaY < 0 ? 1.06 : 0.94)))
    );
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = canvas.width;
    const H = canvas.height;

    if (!dragging) {
      let foundZone: string | null = null;
      [...PIRACY_ZONES, ...STORM_ZONES].forEach((zone) => {
        const [zx, zy] = mercatorProject(
          zone.lat,
          zone.lon,
          viewLat,
          viewLon,
          zoom,
          W,
          H
        );
        const radiusPx = zone.radiusDeg * zoom * (W / 360);
        if (Math.sqrt((mx - zx) ** 2 + (my - zy) ** 2) < radiusPx)
          foundZone = zone.name;
      });
      setHoveredZone(foundZone);

      let foundVessel: LiveVessel | null = null;
      liveVesselsRef.current.forEach((v) => {
        const [vx, vy] = mercatorProject(
          v.lat,
          v.lon,
          viewLat,
          viewLon,
          zoom,
          W,
          H
        );
        if (Math.sqrt((mx - vx) ** 2 + (my - vy) ** 2) < 10) foundVessel = v;
      });
      setHoveredVessel(foundVessel);
      if (foundVessel) setTooltipPos({ x: mx, y: my });
      return;
    }

    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    const panSpeed = 2.5;
    setViewLon((v) => v - (dx / (zoom * (W / 360))) * panSpeed);
    setViewLat((v) =>
      Math.max(-75, Math.min(80, v + (dy / (zoom * (W / 360))) * panSpeed))
    );
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const onMouseUp = () => setDragging(false);
  const onMouseLeave = () => {
    setDragging(false);
    setHoveredZone(null);
    setHoveredVessel(null);
  };

  const allZones = [...PIRACY_ZONES, ...STORM_ZONES];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* ── LAYER TOGGLE BAR — sits above canvas, not over it ── */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '6px 8px',
          background: 'rgba(2,10,22,0.95)',
          borderBottom: '1px solid rgba(0,180,255,0.12)',
          flexWrap: 'wrap',
        }}
      >
        {[
          {
            key: 'storms',
            label: '⛈ STORM ZONES',
            active: showStorms,
            toggle: () => setShowStorms((v) => !v),
            activeColor: '#ff6600',
          },
          {
            key: 'vessels',
            label: '⚓ AIS VESSELS',
            active: showVessels,
            toggle: () => setShowVessels((v) => !v),
            activeColor: '#00b4ff',
          },
          {
            key: 'wind',
            label: '🌬 WIND FLOW',
            active: showWindFlow,
            toggle: () => setShowWindFlow((v) => !v),
            activeColor: '#44ccff',
          },
          {
            key: 'detour',
            label: '↩ DETOUR',
            active: showDetour,
            toggle: () => setShowDetour((v) => !v),
            activeColor: '#ffdd00',
          },
        ].map(({ key, label, active, toggle, activeColor }) => (
          <button
            key={key}
            onClick={toggle}
            style={{
              background: active ? `${activeColor}22` : 'rgba(4,15,30,0.88)',
              border: `1px solid ${
                active ? activeColor + '80' : 'rgba(0,180,255,0.15)'
              }`,
              color: active ? activeColor : '#2a6a8a',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '11px',
              letterSpacing: '0.05em',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: active ? activeColor : '#1a3a4a',
                boxShadow: active ? `0 0 6px ${activeColor}` : 'none',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            {label}
          </button>
        ))}
      </div>

      {/* Canvas row — all overlays are children of this relative wrapper */}
      <div style={{ position: 'relative', flex: 1 }}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={540}
          style={{
            width: '100%',
            height: '100%',
            cursor: dragging ? 'grabbing' : 'grab',
            display: 'block',
            touchAction: 'none',
          }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />

        {/* Zone tooltip */}
        {hoveredZone &&
          (() => {
            const zone = allZones.find((z) => z.name === hoveredZone);
            if (!zone) return null;
            return (
              <div
                style={{
                  position: 'absolute',
                  top: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(4,15,30,0.95)',
                  border: `1px solid ${zone.color}60`,
                  borderLeft: `3px solid ${zone.color}`,
                  padding: '6px 14px',
                  borderRadius: '2px',
                  fontFamily: 'Rajdhani',
                  color: zone.color,
                  fontSize: '13px',
                  pointerEvents: 'none',
                  backdropFilter: 'blur(8px)',
                  zIndex: 10,
                }}
              >
                ⚠ {zone.name} — {'risk' in zone ? zone.risk : ''} RISK
              </div>
            );
          })()}

        {/* Vessel tooltip */}
        {hoveredVessel && (
          <div
            style={{
              position: 'absolute',
              left: tooltipPos.x + 14,
              top: tooltipPos.y - 10,
              background: 'rgba(4,15,30,0.95)',
              border: `1px solid ${vesselColor(hoveredVessel.type)}60`,
              borderLeft: `3px solid ${vesselColor(hoveredVessel.type)}`,
              padding: '6px 12px',
              borderRadius: '2px',
              fontFamily: 'Rajdhani',
              fontSize: '12px',
              color: '#c8e6f5',
              pointerEvents: 'none',
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}
          >
            <div
              style={{
                color: vesselColor(hoveredVessel.type),
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              🚢 {hoveredVessel.name}
            </div>
            <div style={{ color: '#7ab8d4', marginTop: 2 }}>
              {hoveredVessel.type} · {hoveredVessel.sog} kn · COG{' '}
              {hoveredVessel.cog}°
            </div>
            <div style={{ color: '#3a6a8a', fontSize: 10, marginTop: 1 }}>
              {hoveredVessel.lat.toFixed(3)}°
              {hoveredVessel.lat >= 0 ? 'N' : 'S'} ·{' '}
              {hoveredVessel.lon.toFixed(3)}°
              {hoveredVessel.lon >= 0 ? 'E' : 'W'}
            </div>
          </div>
        )}

        {/* Zoom / reset controls (right side) */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {[
            { label: '+', action: () => setZoom((z) => Math.min(12, z * 1.3)) },
            {
              label: '−',
              action: () => setZoom((z) => Math.max(0.8, z / 1.3)),
            },
            {
              label: '⌂',
              action: () => {
                setZoom(2.2);
                setViewLat(20);
                setViewLon(45);
              },
            },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                width: 28,
                height: 28,
                background: 'rgba(4,20,40,0.85)',
                border: '1px solid rgba(0,180,255,0.3)',
                color: '#00b4ff',
                fontFamily: 'Orbitron',
                fontSize: label === '⌂' ? '12px' : '16px',
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              {label}
            </button>
          ))}

          <div style={{ height: 4 }} />

          {/* Piracy toggle */}
          <button
            onClick={() => setShowPiracy((v) => !v)}
            title="Toggle piracy zones"
            style={{
              width: 28,
              height: 28,
              background: showPiracy
                ? 'rgba(255,51,102,0.15)'
                : 'rgba(4,20,40,0.85)',
              border: `1px solid ${
                showPiracy ? 'rgba(255,51,102,0.5)' : 'rgba(0,180,255,0.15)'
              }`,
              color: showPiracy ? '#ff3366' : '#2a5a7a',
              fontSize: '14px',
              cursor: 'pointer',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            ☠
          </button>
        </div>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: 10,
            background: 'rgba(4,15,30,0.85)',
            border: '1px solid rgba(0,180,255,0.15)',
            borderRadius: '3px',
            padding: '5px 10px',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            backdropFilter: 'blur(8px)',
          }}
        >
          {[
            { color: '#00b4ff', label: 'Main route', shape: 'dash' },
            { color: '#ff3366', label: 'Bad weather segment', shape: 'line' },
            { color: '#ffdd00', label: 'Suggested detour', shape: 'dash' },
            { color: '#ff6600', label: 'High gale risk zone', shape: 'circle' },
            { color: '#ffcc00', label: 'Caution zone', shape: 'circle' },
            { color: '#00ccff', label: 'ECA zone', shape: 'circle' },
            { color: '#00b4ff', label: 'AIS vessel', shape: 'triangle' },
            { color: '#00ff88', label: 'Origin', shape: 'dot' },
            { color: '#ff6644', label: 'Destination', shape: 'dot' },
          ].map((l) => (
            <div
              key={l.label}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius:
                    l.shape === 'circle' || l.shape === 'dot' ? '50%' : 0,
                  background: l.color,
                  opacity: 0.9,
                }}
              />
              <span
                style={{
                  fontFamily: 'Rajdhani',
                  fontSize: '10px',
                  color: '#6ab4d0',
                }}
              >
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
