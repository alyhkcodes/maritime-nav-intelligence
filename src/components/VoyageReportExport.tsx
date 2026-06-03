// VoyageReportExport.tsx
// Drop-in component — renders a button that generates a professional PDF voyage report
// Uses browser's built-in print/PDF capability — no external library needed

type RouteScenario = {
  name: string;
  hours: number;
  fuel: number;
  cost: number;
};

type Props = {
  vesselName?: string;
  route?: { lat: number; lon: number }[];
  routes?: RouteScenario[];
  waveHeight?: number | null;
  selectedRoute?: number;
  departureOffset?: number;
  fuelTons?: number;
  distanceNm?: number;
};

const WAYPOINT_NAMES = [
  'ROTTERDAM',
  'GIBRALTAR',
  'PORT SAID',
  'DJIBOUTI',
  'SINGAPORE',
];

function getCIIGrade(
  fuelTons: number,
  distanceNm: number,
  dwt = 50000
): { grade: string; color: string } {
  const co2Grams = fuelTons * 3.17 * 1e6;
  const cii = distanceNm > 0 ? co2Grams / (dwt * distanceNm) : 0;
  if (cii < 3.5) return { grade: 'A', color: '#00aa55' };
  if (cii < 5.0) return { grade: 'B', color: '#66aa22' };
  if (cii < 7.0) return { grade: 'C', color: '#bbaa00' };
  if (cii < 9.5) return { grade: 'D', color: '#cc6600' };
  return { grade: 'E', color: '#cc2244' };
}

function getRiskLabel(score: number): string {
  if (score < 25) return 'LOW RISK';
  if (score < 50) return 'MODERATE';
  if (score < 70) return 'ELEVATED';
  if (score < 85) return 'HIGH RISK';
  return 'CRITICAL';
}

export default function VoyageReportExport({
  vesselName = 'MV NEPTUNE CARRIER',
  route,
  routes = [],
  waveHeight = null,
  selectedRoute = 0,
  departureOffset = 0,
  fuelTons = 850,
  distanceNm = 8400,
}: Props) {
  const generateReport = () => {
    const now = new Date();
    const dateStr = now.toUTCString();
    const reportId = `VR-${now.getFullYear()}${String(
      now.getMonth() + 1
    ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(
      Math.random() * 9000 + 1000
    )}`;

    const selectedScenario = routes[selectedRoute] ?? {
      name: 'Standard Route',
      hours: 312,
      fuel: fuelTons,
      cost: 145000,
    };

    const co2 = (fuelTons * 3.17).toFixed(1);
    const cii = getCIIGrade(fuelTons, distanceNm);
    const riskScore = Math.round(
      30 + (waveHeight ?? 1.5) * 5 + departureOffset * 2
    );
    const riskLabel = getRiskLabel(riskScore);
    const carbonCost = Math.round(fuelTons * 3.17 * 60);

    const waypointRows = (
      route ?? [
        { lat: 51.9, lon: 4.5 },
        { lat: 36.1, lon: -5.3 },
        { lat: 31.2, lon: 32.3 },
        { lat: 12.8, lon: 45.0 },
        { lat: 1.29, lon: 103.85 },
      ]
    )
      .map(
        (pt, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${WAYPOINT_NAMES[i] ?? `WP-${i + 1}`}</strong></td>
        <td>${pt.lat.toFixed(2)}°N</td>
        <td>${pt.lon.toFixed(2)}°E</td>
        <td>${
          i === 0
            ? 'DEPARTURE'
            : i === (route?.length ?? 5) - 1
            ? 'DESTINATION'
            : 'WAYPOINT'
        }</td>
      </tr>
    `
      )
      .join('');

    const scenarioRows = routes
      .map(
        (r, i) => `
      <tr style="${
        i === selectedRoute ? 'background:#e8f4ff;font-weight:600;' : ''
      }">
        <td>${i === selectedRoute ? '★ ' : ''}${r.name}</td>
        <td>${r.hours.toFixed(0)}h</td>
        <td>${r.fuel.toFixed(0)}t</td>
        <td>$${r.cost.toLocaleString()}</td>
        <td>${i === selectedRoute ? 'SELECTED' : '—'}</td>
      </tr>
    `
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Voyage Report ${reportId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Arial', sans-serif; font-size: 11px; color: #1a2a3a; background: white; }
    
    .page { max-width: 800px; margin: 0 auto; padding: 30px; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #003366; padding-bottom: 14px; margin-bottom: 20px; }
    .header-left h1 { font-size: 22px; color: #003366; letter-spacing: 0.05em; }
    .header-left p { font-size: 10px; color: #666; margin-top: 3px; }
    .header-right { text-align: right; }
    .report-id { font-family: monospace; font-size: 12px; color: #003366; font-weight: bold; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 2px; font-size: 10px; font-weight: bold; letter-spacing: 0.1em; margin-top: 4px; }
    
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: bold; color: #003366; letter-spacing: 0.15em; text-transform: uppercase; border-bottom: 1px solid #ccd8e8; padding-bottom: 4px; margin-bottom: 10px; }
    
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    
    .stat-box { background: #f0f6ff; border: 1px solid #ccd8e8; border-radius: 3px; padding: 10px 12px; }
    .stat-label { font-size: 9px; color: #5577aa; letter-spacing: 0.1em; text-transform: uppercase; }
    .stat-value { font-size: 16px; font-weight: bold; color: #003366; margin-top: 2px; }
    .stat-unit { font-size: 9px; color: #778899; }
    
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #003366; color: white; padding: 6px 8px; text-align: left; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; }
    td { padding: 5px 8px; border-bottom: 1px solid #ddeeff; }
    tr:nth-child(even) { background: #f8fcff; }
    
    .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 2px; font-size: 9px; font-weight: bold; }
    .cii-box { width: 48px; height: 48px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; margin: 0 auto; }
    
    .footer { border-top: 1px solid #ccd8e8; padding-top: 10px; margin-top: 20px; display: flex; justify-content: space-between; font-size: 9px; color: #778899; }
    
    .highlight-row { background: #fff8e8 !important; }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <h1>⚓ VOYAGE REPORT</h1>
      <p>Maritime Navigation Intelligence System · Confidential</p>
    </div>
    <div class="header-right">
      <div class="report-id">${reportId}</div>
      <div style="font-size:10px;color:#666;margin-top:4px;">${dateStr}</div>
      <div class="badge" style="background:#003366;color:white;">OFFICIAL DOCUMENT</div>
    </div>
  </div>

  <!-- VESSEL INFO -->
  <div class="section">
    <div class="section-title">Vessel & Voyage Identification</div>
    <div class="grid-4">
      <div class="stat-box">
        <div class="stat-label">Vessel</div>
        <div class="stat-value" style="font-size:12px;">${vesselName}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Route</div>
        <div class="stat-value" style="font-size:12px;">${
          selectedScenario.name
        }</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Distance</div>
        <div class="stat-value">${distanceNm.toLocaleString()} <span class="stat-unit">NM</span></div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Departure Offset</div>
        <div class="stat-value">${
          departureOffset === 0 ? 'NOW' : `+${departureOffset.toFixed(1)}d`
        }</div>
      </div>
    </div>
  </div>

  <!-- KEY METRICS -->
  <div class="section">
    <div class="section-title">Key Voyage Metrics</div>
    <div class="grid-4">
      <div class="stat-box">
        <div class="stat-label">ETA</div>
        <div class="stat-value">${selectedScenario.hours.toFixed(
          0
        )} <span class="stat-unit">hours</span></div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Fuel Load</div>
        <div class="stat-value">${fuelTons.toLocaleString()} <span class="stat-unit">MT</span></div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Total Cost</div>
        <div class="stat-value" style="color:#880000;">$${selectedScenario.cost.toLocaleString()}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Wave Height</div>
        <div class="stat-value">${
          waveHeight?.toFixed(1) ?? '—'
        } <span class="stat-unit">m</span></div>
      </div>
    </div>
  </div>

  <!-- WAYPOINTS -->
  <div class="section">
    <div class="section-title">Waypoint Schedule</div>
    <table>
      <thead><tr><th>#</th><th>Port / Waypoint</th><th>Latitude</th><th>Longitude</th><th>Status</th></tr></thead>
      <tbody>${waypointRows}</tbody>
    </table>
  </div>

  <!-- ROUTE SCENARIOS -->
  ${
    routes.length > 0
      ? `
  <div class="section">
    <div class="section-title">Route Scenario Comparison</div>
    <table>
      <thead><tr><th>Scenario</th><th>Duration</th><th>Fuel (MT)</th><th>Cost (USD)</th><th>Selection</th></tr></thead>
      <tbody>${scenarioRows}</tbody>
    </table>
  </div>`
      : ''
  }

  <!-- ENVIRONMENTAL -->
  <div class="section">
    <div class="section-title">Environmental & Carbon Profile (IMO 2023)</div>
    <div class="grid-3">
      <div class="stat-box">
        <div class="stat-label">CO₂ Emitted</div>
        <div class="stat-value" style="color:#884400;">${co2} <span class="stat-unit">MT</span></div>
        <div style="font-size:9px;color:#778899;margin-top:2px;">HFO @ 3.17 kg CO₂/kg fuel</div>
      </div>
      <div class="stat-box" style="text-align:center;">
        <div class="stat-label">CII Rating</div>
        <div class="cii-box" style="background:${
          cii.color
        }22;border:2px solid ${cii.color};color:${cii.color};">
          <span style="font-size:20px;">${cii.grade}</span>
          <span style="font-size:8px;">CII</span>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Carbon Cost (EU ETS)</div>
        <div class="stat-value" style="color:#884400;">€${carbonCost.toLocaleString()}</div>
        <div style="font-size:9px;color:#778899;margin-top:2px;">@ €60 / tonne CO₂</div>
      </div>
    </div>
  </div>

  <!-- RISK ASSESSMENT -->
  <div class="section">
    <div class="section-title">Risk Assessment</div>
    <div class="grid-2">
      <div class="stat-box">
        <div class="stat-label">Overall Risk Score</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:6px;">
          <div style="font-size:32px;font-weight:bold;color:#003366;">${riskScore}</div>
          <div>
            <div style="font-size:10px;color:#556;">/100 composite</div>
            <span class="risk-badge" style="background:${
              riskScore > 70
                ? '#ffeeee'
                : riskScore > 40
                ? '#fff8ee'
                : '#eeffee'
            };color:${
      riskScore > 70 ? '#cc2244' : riskScore > 40 ? '#cc8800' : '#006633'
    };">${riskLabel}</span>
          </div>
        </div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Risk Factors</div>
        <table style="margin-top:6px;">
          <tr><td>Weather Exposure</td><td><strong>${
            waveHeight
              ? waveHeight > 3
                ? 'HIGH'
                : waveHeight > 1.5
                ? 'MODERATE'
                : 'LOW'
              : 'UNKNOWN'
          }</strong></td></tr>
          <tr><td>Piracy Zones Crossed</td><td><strong>${
            route &&
            route.some(
              (p) => p.lat > 8 && p.lat < 16 && p.lon > 42 && p.lon < 52
            )
              ? 'YES — Gulf of Aden'
              : 'MONITORED'
          }</strong></td></tr>
          <tr><td>Port Congestion</td><td><strong>MODERATE</strong></td></tr>
          <tr><td>Regulatory Compliance</td><td><strong style="color:${
            cii.color
          };">CII ${cii.grade} — ${
      cii.grade === 'E' || cii.grade === 'D' ? 'ACTION REQUIRED' : 'COMPLIANT'
    }</strong></td></tr>
        </table>
      </div>
    </div>
  </div>

  <!-- RECOMMENDATIONS -->
  <div class="section">
    <div class="section-title">ARIA Navigator Recommendations</div>
    <div style="background:#f0f8ff;border:1px solid #aaccee;border-left:3px solid #003366;padding:12px;border-radius:2px;font-size:11px;line-height:1.7;color:#1a2a4a;">
      <strong>1. Route Selection:</strong> ${
        selectedScenario.name
      } selected as optimal based on cost-weather-risk composite scoring.<br>
      <strong>2. Departure Timing:</strong> ${
        departureOffset === 0
          ? 'Immediate departure recommended — current conditions favourable.'
          : `Delay of ${departureOffset.toFixed(
              1
            )} days factored into cost projection. Verify forecast before departure.`
      }<br>
      <strong>3. Piracy Advisory:</strong> Gulf of Aden transit — maintain BMP5 protocols. Register with MSCHOA. Avoid night transit if possible.<br>
      <strong>4. Fuel Strategy:</strong> Bunker at Djibouti if HFO price differential exceeds $15/MT vs Rotterdam basis.<br>
      <strong>5. Carbon:</strong> CII Grade ${cii.grade} — ${
      cii.grade === 'A' || cii.grade === 'B'
        ? 'Target maintained. Continue current speed optimization.'
        : 'Consider slow steaming by 1-2 knots to improve CII by ~0.8 points.'
    }<br>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div>Generated by Maritime Nav Intelligence System · ARIA v2.0</div>
    <div>${reportId} · FOR OFFICIAL USE</div>
    <div>Printed: ${dateStr}</div>
  </div>

</div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Please allow popups to generate the PDF report.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <button
      onClick={generateReport}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        background: 'rgba(0,60,120,0.3)',
        border: '1px solid rgba(0,180,255,0.4)',
        borderRadius: '3px',
        color: '#00b4ff',
        fontFamily: 'Orbitron',
        fontSize: '11px',
        letterSpacing: '0.1em',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          'rgba(0,100,200,0.4)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 0 20px rgba(0,180,255,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          'rgba(0,60,120,0.3)';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      <span style={{ fontSize: '14px' }}>📄</span>
      EXPORT VOYAGE REPORT
    </button>
  );
}
