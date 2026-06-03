import { useCallback, useEffect, useRef, useState } from 'react';
import MapView from './components/MapView';
import StatCard from './components/StatCard';
import ScenarioTable from './components/ScenarioTable';
import VoyageCharts from './components/VoyageCharts';
import CaptainAdvisor from './components/CaptainAdvisor';
import LaycanRescue from './components/LaycanRescue';
import Card from './components/Card';
import WeatherRiskBanner from './components/WeatherRiskBanner';
import MultiShipAIS from './components/MultiShipAIS';
import RouteOptimizer from './components/RouteOptimizer';
import CaptainChat from './components/CaptainChat';
import FleetTracker from './components/FleetTracker';
import ETACountdown from './components/ETACountdown';
import RadarWidget from './components/RadarWidget';
import TimeMachine from './components/TimeMachine';
import ToastManager, { toast } from './components/ToastManager';
import Login from './components/Login';
import LogoutButton from './components/LogoutButton';
import { getUser } from './utils/auth';
import { routeA, routeB, routeC } from './data/routes';
import { vessel } from './data/vessel';
import { getRealWeather } from './services/realWeatherService';
import {
  calculateVoyage,
  calculateVoyageWithWeather,
} from './services/voyageEngine';
import type { LiveVessel } from './components/MapView';
import './App.css';

/* ── OCEAN CANVAS (WebGL bioluminescent waves + cursor particles) ── */
function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const particles = useRef<
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
    }[]
  >([]);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      const ctx2d = canvas.getContext('2d');
      if (!ctx2d) return;
      let t = 0;
      const p2d: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
        maxLife: number;
        size: number;
        hue: number;
      }[] = [];

      const resize2d = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resize2d();
      window.addEventListener('resize', resize2d);

      const tick2d = () => {
        const { width: W, height: H } = canvas;
        ctx2d.clearRect(0, 0, W, H);

        const grad = ctx2d.createRadialGradient(
          W / 2,
          H / 2,
          0,
          W / 2,
          H / 2,
          Math.max(W, H)
        );
        grad.addColorStop(0, '#010d1e');
        grad.addColorStop(0.6, '#010b1a');
        grad.addColorStop(1, '#000810');
        ctx2d.fillStyle = grad;
        ctx2d.fillRect(0, 0, W, H);

        const waveCount = 8;
        for (let i = 0; i < waveCount; i++) {
          const freq = 0.004 + i * 0.001;
          const amp = 18 + i * 6;
          const speed = 0.3 + i * 0.1;
          const yBase = (H / waveCount) * i + H * 0.15;
          const alpha = 0.02 + (i / waveCount) * 0.04;
          ctx2d.beginPath();
          for (let x = 0; x <= W; x += 2) {
            const y =
              yBase +
              Math.sin(x * freq + t * speed) * amp +
              Math.sin(x * freq * 1.7 + t * speed * 0.6) * (amp * 0.4) +
              (mouse.current.x - 0.5) * 30 * Math.sin(x * 0.008);
            if (x === 0) ctx2d.moveTo(x, y);
            else ctx2d.lineTo(x, y);
          }
          ctx2d.strokeStyle = `rgba(0,${140 + i * 8},${200 + i * 5},${alpha})`;
          ctx2d.lineWidth = 1.2;
          ctx2d.stroke();
        }

        if (p2d.length < 120 && Math.random() < 0.3) {
          p2d.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -Math.random() * 0.8 - 0.2,
            life: 0,
            maxLife: 80 + Math.random() * 120,
            size: 1 + Math.random() * 2.5,
            hue: Math.random() > 0.7 ? 170 : Math.random() > 0.5 ? 200 : 145,
          });
        }

        for (let i = p2d.length - 1; i >= 0; i--) {
          const p = p2d[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life++;
          if (p.life > p.maxLife) {
            p2d.splice(i, 1);
            continue;
          }
          const progress = p.life / p.maxLife;
          const opacity = Math.sin(progress * Math.PI) * 0.7;
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx2d.fillStyle = `hsla(${p.hue},100%,65%,${opacity})`;
          ctx2d.fill();
          const grd = ctx2d.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            p.size * 5
          );
          grd.addColorStop(0, `hsla(${p.hue},100%,65%,${opacity * 0.4})`);
          grd.addColorStop(1, 'transparent');
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
          ctx2d.fillStyle = grd;
          ctx2d.fill();
        }

        for (let i = particles.current.length - 1; i >= 0; i--) {
          const cp = particles.current[i];
          cp.x += cp.vx;
          cp.y += cp.vy;
          cp.vy -= 0.01;
          cp.life++;
          if (cp.life > cp.maxLife) {
            particles.current.splice(i, 1);
            continue;
          }
          const pr = cp.life / cp.maxLife;
          const op = Math.sin(pr * Math.PI) * 0.9;
          ctx2d.beginPath();
          ctx2d.arc(cp.x, cp.y, cp.size * (1 - pr * 0.5), 0, Math.PI * 2);
          ctx2d.fillStyle = `rgba(0,255,234,${op})`;
          ctx2d.fill();
        }

        t += 0.015;
        raf.current = requestAnimationFrame(tick2d);
      };
      raf.current = requestAnimationFrame(tick2d);
      return () => {
        cancelAnimationFrame(raf.current);
        window.removeEventListener('resize', resize2d);
      };
    }
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = e.clientY / window.innerHeight;
      if (Math.random() < 0.4) {
        particles.current.push({
          x: e.clientX + (Math.random() - 0.5) * 16,
          y: e.clientY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 0.5,
          life: 0,
          maxLife: 25 + Math.random() * 30,
          size: 1.5 + Math.random() * 2,
        });
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="ocean-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

/* ── CUSTOM CURSOR ── */
function NavCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const dotPos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${pos.current.x}px`;
        cursorRef.current.style.top = `${pos.current.y}px`;
      }
      dotPos.current.x += (pos.current.x - dotPos.current.x) * 0.15;
      dotPos.current.y += (pos.current.y - dotPos.current.y) * 0.15;
      if (dotRef.current) {
        dotRef.current.style.left = `${dotPos.current.x}px`;
        dotRef.current.style.top = `${dotPos.current.y}px`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <div
        ref={cursorRef}
        id="nav-cursor"
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 999999,
          transform: 'translate(-50%,-50%)',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="rgba(0,180,255,0.6)"
            strokeWidth="1"
          />
          <circle
            cx="16"
            cy="16"
            r="10"
            fill="none"
            stroke="rgba(0,255,234,0.3)"
            strokeWidth="0.5"
          />
          <line
            x1="16"
            y1="2"
            x2="16"
            y2="8"
            stroke="#00b4ff"
            strokeWidth="1.2"
          />
          <line
            x1="16"
            y1="24"
            x2="16"
            y2="30"
            stroke="#00b4ff"
            strokeWidth="1.2"
          />
          <line
            x1="2"
            y1="16"
            x2="8"
            y2="16"
            stroke="#00b4ff"
            strokeWidth="1.2"
          />
          <line
            x1="24"
            y1="16"
            x2="30"
            y2="16"
            stroke="#00b4ff"
            strokeWidth="1.2"
          />
          <circle cx="16" cy="16" r="2" fill="rgba(0,255,234,0.5)" />
        </svg>
      </div>
      <div
        ref={dotRef}
        id="nav-cursor-dot"
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 999999,
          transform: 'translate(-50%,-50%)',
        }}
      />
    </>
  );
}

/* ── MAIN APP ── */
function App() {
  const [user, setUser] = useState(getUser());
  const [waveHeight, setWaveHeight] = useState<number | null>(null);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<'A' | 'B' | 'C'>('A');
  const [clock, setClock] = useState(new Date());
  const [departureOffset, setDepartureOffset] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [liveVessels, setLiveVessels] = useState<LiveVessel[]>([]);

  const handleVesselsUpdate = useCallback((vessels: LiveVessel[]) => {
    const seen = new Set<string>();
    const unique = vessels.filter((v) => {
      if (seen.has(v.mmsi)) return false;
      seen.add(v.mmsi);
      return true;
    });
    setLiveVessels(unique);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    async function loadWeather() {
      try {
        const results = await Promise.all(
          routeA.map((p) => getRealWeather(p.lat, p.lon))
        );
        console.log('Weather sample:', results[0]); // ← check this in browser console
        const normalized = results.map((r: any) => ({
          ...r,
          waveHeight:
            r.waveHeight ??
            r.wave_height ??
            r.waveHt ??
            r.significantWaveHeight ??
            r.height ??
            0,
        }));
        setWeatherData(normalized);
        const wh = normalized[0]?.waveHeight ?? 0;
        setWaveHeight(wh);
        toast('Weather data loaded successfully', 'success');
        if (wh > 3) toast(`High seas alert — ${wh}m waves detected`, 'warning');
      } catch (err) {
        console.error('Weather error:', err);
        toast('Weather service unavailable — using fallback', 'error');
      }
    }
    loadWeather();
  }, []);

  if (!user)
    return (
      <>
        <OceanCanvas />
        <NavCursor />
        <Login onLogin={() => setUser(getUser())} />
      </>
    );

  const resultA =
    weatherData.length > 0
      ? calculateVoyageWithWeather(routeA, weatherData, vessel)
      : calculateVoyage(routeA, vessel);
  const resultB = calculateVoyage(routeB, vessel);
  const resultC = calculateVoyage(routeC, vessel);

  const scenarios = [
    {
      name: 'Route A - Direct',
      hours: resultA.totalHours,
      fuel: resultA.totalFuelTons,
      cost: resultA.totalCost,
    },
    {
      name: 'Route B - Southern Detour',
      hours: resultB.totalHours,
      fuel: resultB.totalFuelTons,
      cost: resultB.totalCost,
    },
    {
      name: 'Route C - Weather Optimized',
      hours: resultC.totalHours,
      fuel: resultC.totalFuelTons,
      cost: resultC.totalCost,
    },
  ];

  const activeRoute =
    selectedRoute === 'A' ? routeA : selectedRoute === 'B' ? routeB : routeC;
  const eta = new Date(
    Date.now() + resultA.totalHours * (1 - departureOffset * 0.01) * 3600000
  );

  return (
    <>
      <OceanCanvas />
      <NavCursor />

      <div
        id="app-root"
        style={{
          padding: '28px 28px 48px',
          maxWidth: '1440px',
          margin: '0 auto',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.6s ease',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <ToastManager />
        <LogoutButton onLogout={() => setUser(null)} />

        {/* ── HEADER ── */}
        <div className="header-bridge">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div className="brand-title">
                <span className="brand-anchor">⚓</span>
                MARITIME NAV INTELLIGENCE
              </div>
              <div className="brand-subtitle">
                VOYAGE COMMAND & ROUTING SYSTEM
                <span className="status-pill">● OPERATIONAL</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="clock-display">{clock.toLocaleTimeString()}</div>
              <div
                style={{
                  fontFamily: 'Rajdhani',
                  fontSize: 11,
                  color: 'var(--text-dim)',
                  letterSpacing: '0.18em',
                  marginTop: 4,
                }}
              >
                {clock
                  .toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <WeatherRiskBanner waveHeight={waveHeight} />

        {/* ── STAT GRID ── */}
        <div className="grid-stat mb-20">
          <StatCard
            title="Distance"
            value={`${resultA.totalDistance.toFixed(0)} NM`}
          />
          <StatCard
            title="Fuel Load"
            value={`${resultA.totalFuelTons.toFixed(1)} T`}
          />
          <StatCard
            title="Est. Cost"
            value={`$${resultA.totalCost.toFixed(0)}`}
          />
          <StatCard
            title="Duration"
            value={`${resultA.totalHours.toFixed(1)}h`}
          />
          <StatCard title="Wave Ht" value={`${waveHeight ?? '—'} m`} />
          <StatCard title="Data Pts" value={`${weatherData.length}`} />
        </div>

        {/* ── RADAR + ETA ── */}
        <div className="grid-2 mb-20">
          <Card title="Radar — Contact Overlay" accent="green">
            <RadarWidget />
          </Card>
          <Card title="ETA Countdown" accent="cyan">
            <ETACountdown eta={eta} />
          </Card>
        </div>

        {/* ── FLEET + OPTIMIZER ── */}
        <div className="grid-2 mb-20">
          <Card title="Fleet Tracking" accent="cyan">
            <FleetTracker />
          </Card>
          <Card title="AI Route Optimizer" accent="green">
            <RouteOptimizer routes={scenarios} waveHeight={waveHeight} />
          </Card>
        </div>

        {/* ── TIME MACHINE ── */}
        <div className="mb-20">
          <Card
            title="Voyage Time Machine — Departure Optimizer"
            accent="amber"
          >
            <TimeMachine
              baseCost={resultA.totalCost}
              baseHours={resultA.totalHours}
              offset={departureOffset}
              onChange={setDepartureOffset}
            />
          </Card>
        </div>

        {/* ── MAP ── */}
        <div className="mb-20">
          <Card title="Navigation Map — Live Route Display" accent="blue">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['A', 'B', 'C'] as const).map((r) => (
                <button
                  key={r}
                  className={`nav-btn ${selectedRoute === r ? 'active' : ''}`}
                  onClick={() => setSelectedRoute(r)}
                >
                  ROUTE {r}
                </button>
              ))}
            </div>
            <MapView route={activeRoute} liveVessels={liveVessels} />
            <MultiShipAIS
              route={activeRoute}
              onVesselsUpdate={handleVesselsUpdate}
            />
          </Card>
        </div>

        {/* ── SCENARIO + ADVISOR ── */}
        <div className="grid-2 mb-20">
          <Card title="Scenario Analysis" accent="amber">
            <ScenarioTable scenarios={scenarios} />
          </Card>
          <Card title="Captain Advisor" accent="cyan">
            <CaptainAdvisor
              waveHeight={waveHeight}
              totalHours={resultA.totalHours}
              totalFuel={resultA.totalFuelTons}
            />
          </Card>
        </div>

        {/* ── CHARTS ── */}
        <div className="mb-20">
          <Card title="Voyage Analytics" accent="blue">
            <VoyageCharts weatherData={weatherData} />
          </Card>
        </div>

        {/* ── CAPTAIN CHAT ── */}
        <div className="mb-20">
          <Card title="Captain AI Chat" accent="green">
            <CaptainChat
              waveHeight={waveHeight}
              totalHours={resultA.totalHours}
              totalFuel={resultA.totalFuelTons}
            />
          </Card>
        </div>

        {/* ── LAYCAN ── */}
        <Card title="Laycan Rescue Engine" accent="red">
          <LaycanRescue eta={eta} />
        </Card>
      </div>
    </>
  );
}

export default App;
