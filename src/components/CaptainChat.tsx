import { useState, useRef, useEffect } from 'react';

type Props = {
  waveHeight: number | null;
  totalHours: number;
  totalFuel: number;
};

type Message = { role: 'user' | 'captain'; text: string; id: number };

function getReply(
  input: string,
  waveHeight: number | null,
  totalHours: number,
  totalFuel: number
): string {
  const q = input.toLowerCase();
  const wave = waveHeight ?? 1.5;
  const fuelCostPerTon = 650;
  const totalCost = Math.round(totalFuel * fuelCostPerTon);

  if (
    q.includes('fuel') &&
    (q.includes('cost') || q.includes('price') || q.includes('much'))
  ) {
    return `Current fuel load: ${totalFuel.toFixed(
      0
    )} metric tons HFO.\nAt $${fuelCostPerTon}/MT, total bunker cost is approximately $${totalCost.toLocaleString()}.\nRecommendation: Consider bunkering at Djibouti if Rotterdam–Singapore HFO spread exceeds $15/MT.`;
  }

  if (q.includes('fuel')) {
    return `Fuel load: ${totalFuel.toFixed(
      0
    )} MT HFO aboard.\nEstimated burn rate: ~42 MT/day at 14 knots.\nAt current speed, reserve margin is ${Math.round(
      totalFuel * 0.12
    )} MT — within SOLAS safe operating limits.`;
  }

  if (
    q.includes('weather') ||
    q.includes('wave') ||
    q.includes('sea state') ||
    q.includes('swell')
  ) {
    const state =
      wave < 1.25
        ? 'Slight (Beaufort 2–3)'
        : wave < 2.5
        ? 'Moderate (Beaufort 4)'
        : wave < 4
        ? 'Rough (Beaufort 5–6)'
        : 'Very Rough (Beaufort 7+)';
    const advice =
      wave > 3.5
        ? 'Recommend reducing speed to 11 knots. Expect 8–12% fuel burn increase. Secure deck cargo.'
        : wave > 2.0
        ? 'Moderate conditions. Maintain current speed. Monitor forecast at WP3.'
        : 'Favourable conditions. Optimal speed window — no adjustments required.';
    return `Current sea state: ${state}\nWave height: ${wave.toFixed(
      1
    )}m\n${advice}`;
  }

  if (
    q.includes('eta') ||
    q.includes('arrival') ||
    q.includes('time') ||
    q.includes('when')
  ) {
    const days = Math.floor(totalHours / 24);
    const hours = Math.round(totalHours % 24);
    return `ETA to Singapore: ${days} days, ${hours} hours from departure.\nTotal passage: ${totalHours.toFixed(
      1
    )} hours.\nNote: Suez Canal transit adds ~18h waiting time not included in base ETA. Factor tidal window at destination.`;
  }

  if (
    q.includes('piracy') ||
    q.includes('pirate') ||
    q.includes('security') ||
    q.includes('gulf of aden') ||
    q.includes('somalia')
  ) {
    return `⚠ PIRACY ADVISORY — Gulf of Aden & Somali Basin:\n• Register with MSCHOA before transit\n• Activate BMP5 protocols: razor wire, fire hoses, citadel ready\n• Transit at maximum speed (>18 kts if possible)\n• Maintain radio watch on Ch 16 + contact UKMTO\n• Current IMB threat level: HIGH in 8–14°N corridor`;
  }

  if (
    q.includes('route') ||
    q.includes('waypoint') ||
    q.includes('course') ||
    q.includes('heading')
  ) {
    return `Optimal routing: Rotterdam → Gibraltar Strait → Port Said → Suez Canal → Bab-el-Mandeb → Djibouti → Singapore.\n\nTotal: ~8,400 NM. Key decision points:\n• Gibraltar: weather window check\n• Port Said: Suez convoy slot (book 48h ahead)\n• Djibouti: bunkering opportunity\n• Malacca: TSS compliance required`;
  }

  if (
    q.includes('speed') ||
    q.includes('knot') ||
    q.includes('slow') ||
    q.includes('fast') ||
    q.includes('laycan') ||
    q.includes('adjust')
  ) {
    const savedFuel = Math.round(totalFuel * 0.18);
    const savedCost = Math.round(savedFuel * 650);
    const addedHours = Math.round(totalHours * 0.15);
    const recoverySpeed = 13.5;
    const recoveryHours = Math.round(totalHours * 0.07);
    return (
      `SPEED ADJUSTMENT ANALYSIS:\n\n` +
      `▸ Current speed: 14.2 kn → ETA on schedule\n` +
      `▸ Slow to 11.5 kn: saves ~${savedFuel} MT VLSFO ($${savedCost.toLocaleString()}) but adds +${addedHours}h\n` +
      `▸ Increase to ${recoverySpeed} kn: recovers ~${recoveryHours}h buffer if behind laycan\n\n` +
      `LAYCAN RECOMMENDATION:\n` +
      `If current ETA is within 12h of laycan close, increase to ${recoverySpeed} kn during Bay of Biscay leg to recover ${recoveryHours}h buffer.\n` +
      `If >24h buffer remains, slow to 12 kn and save $${Math.round(
        savedCost * 0.6
      ).toLocaleString()} in bunker costs.\n\n` +
      `Slow steaming also improves CII rating by ~0.8 points.`
    );
  }

  if (
    q.includes('carbon') ||
    q.includes('co2') ||
    q.includes('cii') ||
    q.includes('emission') ||
    q.includes('imo')
  ) {
    const co2 = (totalFuel * 3.17).toFixed(1);
    return `Carbon profile for this voyage:\n• CO₂ emitted: ${co2} metric tons (HFO × 3.17)\n• EU ETS cost: ~€${Math.round(
      parseFloat(co2) * 60
    ).toLocaleString()} at €60/tonne\n• IMO CII impact: B-grade estimated at current speed\n\nTo achieve Grade A: reduce speed by 1.5 knots or switch to VLSFO.`;
  }

  if (
    q.includes('port') ||
    q.includes('congestion') ||
    q.includes('berth') ||
    q.includes('singapore') ||
    q.includes('rotterdam')
  ) {
    return `Port status (last updated):\n• Rotterdam: 6h avg berth wait. Tidal window 0400–0800 UTC.\n• Port Said: Northbound convoy 0600 daily. Pre-booking required.\n• Djibouti: Low congestion. Bunker barge available 24h.\n• Singapore PSA: 8–12h avg wait at Pasir Panjang. Pilot required for berths B14–B32.`;
  }

  if (q.includes('suez') || q.includes('canal') || q.includes('transit')) {
    return `Suez Canal Transit:\n• Northbound convoy: 0600 daily (book 48h ahead via Suez Canal Authority)\n• Southbound convoy: 0400 daily\n• Transit time: ~14–16 hours\n• Dues: ~$200,000–$400,000 depending on vessel GT and cargo\n• Current wait: ~12–18h at Port Said anchorage\n• Pilot mandatory: board at Port Said breakwater`;
  }

  if (
    q.includes('depart') ||
    q.includes('leave') ||
    q.includes('when should') ||
    q.includes('best time')
  ) {
    return `Optimal departure window analysis:\n• Departing NOW: ${
      wave <= 2.0 ? 'Favourable' : 'Marginal'
    } — wave height ${wave.toFixed(
      1
    )}m\n• +2 days: Forecast clearing. Recommended if wave > 3m currently.\n• +4 days: Risk of North Atlantic low pressure system developing.\n\nRecommendation: ${
      wave > 3
        ? 'Delay 2 days — weather penalty exceeds schedule cost.'
        : 'Depart within 12h window for optimal conditions.'
    }`;
  }

  if (
    q.includes('risk') ||
    q.includes('danger') ||
    q.includes('safe') ||
    q.includes('threat')
  ) {
    return `Voyage risk summary:\n• Weather: ${
      wave > 3
        ? '⚠ HIGH — rough seas forecast'
        : wave > 1.5
        ? '● MODERATE'
        : '✓ LOW'
    }\n• Piracy: ⚠ ELEVATED — Gulf of Aden transit required\n• Port congestion: ● MODERATE — Suez wait 12–18h\n• Regulatory: ✓ CII compliant at current load\n\nOverall composite risk score: ${Math.round(
      35 + wave * 4
    )}/100`;
  }

  if (
    q.includes('hello') ||
    q.includes('hi ') ||
    q.match(/^hi$/) ||
    q.includes('hey')
  ) {
    return `ARIA online. All systems nominal.\nCurrent voyage: Rotterdam → Singapore, ${totalHours.toFixed(
      0
    )}h ETA.\nSea state: ${wave.toFixed(1)}m. Fuel: ${totalFuel.toFixed(
      0
    )} MT aboard.\n\nWhat's your query, Captain?`;
  }

  if (q.includes('help') || q.includes('what can') || q.includes('capabilit')) {
    return `ARIA capabilities:\n• Route & waypoint planning\n• Fuel cost & consumption analysis\n• Weather & sea state assessment\n• ETA calculation\n• Piracy risk advisory\n• Suez Canal transit info\n• Port congestion & berth info\n• Carbon / CII rating analysis\n• Departure time optimization\n\nAsk me anything about this voyage.`;
  }

  const fallbacks = [
    `Query noted. Based on current voyage parameters — ${totalHours.toFixed(
      0
    )}h ETA, ${totalFuel.toFixed(0)} MT fuel, ${wave.toFixed(
      1
    )}m sea state — all systems within acceptable margins. Specify your concern: weather, fuel, route, piracy, or port?`,
    `Running analysis... No critical alerts for that parameter. Current voyage is ${
      wave > 2.5
        ? 'experiencing moderate weather stress'
        : 'proceeding nominally'
    }. Do you want a full risk breakdown?`,
    `Acknowledged. Standing by. Current priority: monitor WP3 (Port Said) for convoy slot confirmation. Is there a specific waypoint or system you want me to assess?`,
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

const SUGGESTIONS = [
  "What's the fuel cost?",
  'Check weather conditions',
  'Piracy advisory',
  'ETA to Singapore',
  'Adjust speed for laycan',
  'Carbon / CII rating',
  'Suez Canal transit',
  'Optimize speed',
];

export default function CaptainChat({
  waveHeight,
  totalHours,
  totalFuel,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'captain',
      text: "ARIA online. Route intelligence active. Voyage data loaded — Rotterdam to Singapore, all systems nominal.\n\nWhat's your query, Captain?",
      id: 1,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const msgId = useRef(2);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    const userMsg: Message = { role: 'user', text: q, id: msgId.current++ };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    const delay = 600 + Math.random() * 700;
    setTimeout(() => {
      const reply = getReply(q, waveHeight, totalHours, totalFuel);
      setMessages((prev) => [
        ...prev,
        { role: 'captain', text: reply, id: msgId.current++ },
      ]);
      setTyping(false);
    }, delay);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '4px 2px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,180,255,0.2) transparent',
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                flexShrink: 0,
                background:
                  msg.role === 'captain'
                    ? 'radial-gradient(circle, rgba(0,180,255,0.3), rgba(0,80,160,0.4))'
                    : 'radial-gradient(circle, rgba(0,255,136,0.2), rgba(0,100,60,0.3))',
                border: `1px solid ${
                  msg.role === 'captain'
                    ? 'rgba(0,180,255,0.5)'
                    : 'rgba(0,255,136,0.4)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontFamily: 'Orbitron',
                color: msg.role === 'captain' ? '#00b4ff' : '#00ff88',
              }}
            >
              {msg.role === 'captain' ? 'AI' : 'YOU'}
            </div>
            <div
              style={{
                maxWidth: '82%',
                padding: '9px 12px',
                background:
                  msg.role === 'captain'
                    ? 'rgba(0,40,80,0.7)'
                    : 'rgba(0,60,40,0.5)',
                border: `1px solid ${
                  msg.role === 'captain'
                    ? 'rgba(0,180,255,0.2)'
                    : 'rgba(0,255,136,0.15)'
                }`,
                borderRadius:
                  msg.role === 'captain'
                    ? '2px 8px 8px 8px'
                    : '8px 2px 8px 8px',
                fontFamily: 'Rajdhani',
                fontSize: '14px',
                lineHeight: 1.55,
                color: '#d0eeff',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {typing && (
          <div
            style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(0,180,255,0.3), rgba(0,80,160,0.4))',
                border: '1px solid rgba(0,180,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontFamily: 'Orbitron',
                color: '#00b4ff',
                flexShrink: 0,
              }}
            >
              AI
            </div>
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(0,40,80,0.7)',
                border: '1px solid rgba(0,180,255,0.2)',
                borderRadius: '2px 8px 8px 8px',
                display: 'flex',
                gap: '5px',
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#00b4ff',
                    animation: `ariadot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          margin: '8px 0 6px',
        }}
      >
        {SUGGESTIONS.slice(0, 4).map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            style={{
              background: 'rgba(0,180,255,0.07)',
              border: '1px solid rgba(0,180,255,0.2)',
              color: '#5aaccc',
              fontFamily: 'Rajdhani',
              fontSize: '11px',
              padding: '3px 9px',
              borderRadius: '2px',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about fuel, weather, route, piracy..."
          style={{
            flex: 1,
            background: 'rgba(0,180,255,0.07)',
            border: '1px solid rgba(0,180,255,0.25)',
            borderRadius: '3px',
            color: '#e0f4ff',
            fontFamily: 'Rajdhani',
            fontSize: '14px',
            padding: '9px 12px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={typing || !input.trim()}
          style={{
            background: typing ? 'rgba(0,40,80,0.4)' : 'rgba(0,180,255,0.2)',
            border: '1px solid rgba(0,180,255,0.5)',
            color: typing ? '#3a6080' : '#00b4ff',
            fontFamily: 'Orbitron',
            fontSize: '11px',
            padding: '9px 14px',
            cursor: typing ? 'not-allowed' : 'pointer',
            borderRadius: '3px',
            letterSpacing: '0.05em',
          }}
        >
          SEND
        </button>
      </div>

      <style>{`
        @keyframes ariadot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
