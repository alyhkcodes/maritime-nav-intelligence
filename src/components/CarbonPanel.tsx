import { useMemo } from 'react';

type Props = {
  fuelTons: number; // total fuel burn in metric tons
  distanceNm: number; // voyage distance in nautical miles
  dwt?: number; // deadweight tonnage (default 50000 for bulk carrier)
};

// CII Rating thresholds (simplified, based on IMO 2023 reference lines)
// Lower CII = better (less CO2 per capacity-distance)
function getCIIRating(cii: number): {
  grade: string;
  color: string;
  label: string;
} {
  // These are illustrative thresholds — real values depend on ship type & size
  if (cii < 3.5) return { grade: 'A', color: '#00ff88', label: 'Superior' };
  if (cii < 5.0) return { grade: 'B', color: '#88ff44', label: 'Good' };
  if (cii < 7.0) return { grade: 'C', color: '#ffdd00', label: 'Required' };
  if (cii < 9.5)
    return { grade: 'D', color: '#ff8800', label: 'Minor deficit' };
  return { grade: 'E', color: '#ff3366', label: 'Non-compliant' };
}

const BARS = ['A', 'B', 'C', 'D', 'E'];
const BAR_COLORS = ['#00ff88', '#88ff44', '#ffdd00', '#ff8800', '#ff3366'];

export default function CarbonPanel({
  fuelTons,
  distanceNm,
  dwt = 50000,
}: Props) {
  const metrics = useMemo(() => {
    // CO2 calculation: HFO emits ~3.17 tons CO2 per ton fuel burned
    const co2Tons = fuelTons * 3.17;
    const co2Kg = co2Tons * 1000;

    // CII = CO2 (grams) / (DWT × distance nautical miles)
    const co2Grams = co2Kg * 1000;
    const cii = distanceNm > 0 ? co2Grams / (dwt * distanceNm) : 0;

    const rating = getCIIRating(cii);

    // Equivalent comparisons for impact
    const carYears = (co2Tons / 4.6).toFixed(1); // avg car ~4.6t CO2/year
    const treesNeeded = Math.round(co2Tons * 45); // ~45 trees to offset 1t CO2/year

    // Carbon cost at EU ETS ~€60/ton
    const carbonCostEur = Math.round(co2Tons * 60);

    return { co2Tons, cii, rating, carYears, treesNeeded, carbonCostEur };
  }, [fuelTons, distanceNm, dwt]);

  const gradeIndex = BARS.indexOf(metrics.rating.grade);

  return (
    <div
      style={{
        background: 'rgba(4,20,40,0.6)',
        border: '1px solid rgba(0,180,255,0.15)',
        borderRadius: '4px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontFamily: 'Orbitron',
            fontSize: '11px',
            color: '#00b4ff',
            letterSpacing: '0.15em',
          }}
        >
          CARBON / CII RATING
        </div>
        <div
          style={{ fontFamily: 'Rajdhani', fontSize: '11px', color: '#3a7090' }}
        >
          IMO 2023 · HFO @ 3.17 kg CO₂/kg
        </div>
      </div>

      {/* CII Grade Display */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {/* Big Grade Circle */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: `3px solid ${metrics.rating.color}`,
            boxShadow: `0 0 20px ${metrics.rating.color}40, inset 0 0 20px ${metrics.rating.color}15`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: `radial-gradient(circle, ${metrics.rating.color}15, transparent 70%)`,
          }}
        >
          <div
            style={{
              fontFamily: 'Orbitron',
              fontSize: '32px',
              fontWeight: 700,
              color: metrics.rating.color,
              lineHeight: 1,
            }}
          >
            {metrics.rating.grade}
          </div>
          <div
            style={{
              fontFamily: 'Rajdhani',
              fontSize: '10px',
              color: metrics.rating.color,
              opacity: 0.8,
              letterSpacing: '0.1em',
            }}
          >
            CII
          </div>
        </div>

        {/* Grade bars */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {BARS.map((bar, i) => (
            <div
              key={bar}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <div
                style={{
                  fontFamily: 'Orbitron',
                  fontSize: '10px',
                  width: 12,
                  color: i === gradeIndex ? BAR_COLORS[i] : '#2a4060',
                  fontWeight: i === gradeIndex ? 700 : 400,
                }}
              >
                {bar}
              </div>
              <div
                style={{
                  flex: 1,
                  height: i === gradeIndex ? 10 : 6,
                  background:
                    i === gradeIndex ? BAR_COLORS[i] : `${BAR_COLORS[i]}25`,
                  borderRadius: '1px',
                  boxShadow:
                    i === gradeIndex ? `0 0 8px ${BAR_COLORS[i]}80` : 'none',
                  transition: 'all 0.3s',
                  position: 'relative',
                }}
              >
                {i === gradeIndex && (
                  <div
                    style={{
                      position: 'absolute',
                      right: -6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft: `6px solid ${BAR_COLORS[i]}`,
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontFamily: 'Rajdhani',
                  fontSize: '9px',
                  color: i === gradeIndex ? BAR_COLORS[i] : '#1a3050',
                  width: 70,
                }}
              >
                {
                  [
                    'Superior',
                    'Good',
                    'Required',
                    'Minor deficit',
                    'Non-compliant',
                  ][i]
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          borderTop: '1px solid rgba(0,180,255,0.1)',
          paddingTop: '12px',
        }}
      >
        {[
          {
            label: 'CO₂ EMITTED',
            value: `${metrics.co2Tons.toFixed(1)}t`,
            color: '#ff8844',
          },
          {
            label: 'CII VALUE',
            value: metrics.cii.toFixed(2),
            color: metrics.rating.color,
          },
          {
            label: 'CARBON COST',
            value: `€${metrics.carbonCostEur.toLocaleString()}`,
            color: '#ffaa00',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(0,180,255,0.1)',
              borderRadius: '3px',
              padding: '8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'Share Tech Mono',
                fontSize: '16px',
                color: s.color,
                fontWeight: 600,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontFamily: 'Rajdhani',
                fontSize: '10px',
                color: '#5a9ab8',
                letterSpacing: '0.1em',
                marginTop: '2px',
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Impact equivalence */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 10px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '3px',
          border: '1px solid rgba(255,100,0,0.1)',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '16px' }}>🌍</span>
        <span
          style={{ fontFamily: 'Rajdhani', fontSize: '12px', color: '#8ab8cc' }}
        >
          Equivalent to{' '}
          <span style={{ color: '#ff8844' }}>{metrics.carYears} years</span> of
          average car driving &nbsp;·&nbsp; Offset requires{' '}
          <span style={{ color: '#00ff88' }}>
            {metrics.treesNeeded.toLocaleString()} trees
          </span>
        </span>
      </div>
    </div>
  );
}
