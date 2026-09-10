import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppContext';

/* ─────────────────────────────────────────────────────────
   Tick computation — major ticks every `step` units from 0
   ───────────────────────────────────────────────────────── */
function buildTicks(max, step = 5) {
  if (!Number.isFinite(max) || max <= 0) return [0];
  let s = step;
  // If range is tiny, auto-shrink step to still get ~4-8 ticks
  while (max / s < 3 && s > 1e-4) s /= 5;
  const ticks = [];
  for (let v = 0; v <= max + s * 1e-6; v = parseFloat((v + s).toPrecision(10))) {
    ticks.push(parseFloat(v.toPrecision(8)));
  }
  if (ticks[ticks.length - 1] < max - s * 1e-6) ticks.push(parseFloat(max.toPrecision(8)));
  return ticks;
}

/** Drop trailing zeros from a decimal string */
function fmt(v) {
  if (Number.isInteger(v) || Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return v.toFixed(1).replace(/\.0$/, '');
}

/* ─────────────────────────────────────────────────────────
   Viridis gradient — bottom (cold) → top (warm)
   ───────────────────────────────────────────────────────── */
const VIRIDIS = `linear-gradient(to top,
  #440154 0%,
  #3b528b 25%,
  #21918c 50%,
  #5ec962 75%,
  #fde725 100%)`;

/* ─────────────────────────────────────────────────────────
   Sub-module: GradientBar
   ───────────────────────────────────────────────────────── */
function GradientBar() {
  return (
    <div style={{
      width:        '12px',
      flex:         1,
      background:   VIRIDIS,
      borderRadius: '6px',
      flexShrink:   0,
      boxShadow: [
        '0 0 18px rgba(0,210,200,0.18)',
        'inset 0 0 0 1px rgba(255,255,255,0.10)',
      ].join(','),
    }} />
  );
}

/* ─────────────────────────────────────────────────────────
   Sub-module: TickRuler
   ───────────────────────────────────────────────────────── */
function TickRuler({ majorTicks, subCount, scaleMax }) {
  const toTop = (v) => `${100 - (v / scaleMax) * 100}%`;

  return (
    <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>

      {/* ── Major ticks ── */}
      {majorTicks.map((v) => (
        <div key={v} style={{
          position:  'absolute',
          top:       toTop(v),
          left:      0,
          right:     0,
          transform: 'translateY(-50%)',
          display:   'flex',
          alignItems: 'center',
          gap:        '4px',
        }}>
          {/* tick mark */}
          <div style={{
            width:      '8px',
            height:     '1.5px',
            background: 'rgba(0,220,200,0.75)',
            flexShrink: 0,
            borderRadius: '1px',
          }} />
          {/* label */}
          <span style={{
            fontSize:      '8.5px',
            fontWeight:    '600',
            fontFamily:    "'Inter','Segoe UI',sans-serif",
            color:         'rgba(224,244,255,0.90)',
            letterSpacing: '0.02em',
            lineHeight:    1,
            whiteSpace:    'nowrap',
          }}>
            {fmt(v)}°
          </span>
        </div>
      ))}

      {/* ── Sub-ticks ── */}
      {majorTicks.length > 1 && majorTicks.slice(0, -1).map((v, i) => {
        const next = majorTicks[i + 1];
        const subStep = (next - v) / (subCount + 1);
        return Array.from({ length: subCount }, (_, k) => {
          const sv = v + subStep * (k + 1);
          return (
            <div key={sv} style={{
              position:  'absolute',
              top:       toTop(sv),
              left:      0,
              transform: 'translateY(-50%)',
            }}>
              <div style={{
                width:        '5px',
                height:       '1px',
                background:   'rgba(0,190,190,0.38)',
                borderRadius: '1px',
              }} />
            </div>
          );
        });
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────────────────── */
export default function ScientificLegend() {
  const { primaryView, surfaceData } = useAppState();

  /* ── Derive display config from state ── */
  const config = useMemo(() => {
    if (primaryView === 'None') return null;
    if (primaryView === 'Currents') {
      return { label: 'Currents', units: 'm/s', showGradient: false };
    }
    if (!surfaceData) return null;
    const { valueMax, units } = surfaceData;
    const labels = { Temperature: 'Temperature', Salinity: 'Salinity', Depth: 'Depth' };
    return {
      label:        labels[primaryView] || primaryView,
      units:        units || '',
      max:          valueMax,
      showGradient: true,
    };
  }, [primaryView, surfaceData]);

  /* ── Always call hooks before any conditional return ── */
  const majorTicks = useMemo(() => {
    if (!config?.showGradient || typeof config.max !== 'number') return [];
    return buildTicks(config.max, 5);
  }, [config]);

  if (!config) return null;

  const scaleMax = typeof config.max === 'number' ? config.max : 0;

  /* ── Layout ── */
  return (
    <div style={{
      position:      'fixed',
      left:          '16px',
      /* --header-height is 64px per App.css :root */
      top:           '68px',   /* 64px header + 4px gap */
      bottom:        '46px',   /* above 42px status bar */
      zIndex:        999,
      width:         '70px',
      display:       'flex',
      flexDirection: 'column',
      pointerEvents: 'none',
    }}>

      {/* Glass card */}
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        height:         '100%',
        background:     'linear-gradient(175deg, rgba(5,14,40,0.82) 0%, rgba(2,8,24,0.93) 100%)',
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        border:         '1px solid rgba(0,220,200,0.17)',
        borderTop:      '1px solid rgba(255,255,255,0.09)',
        borderRadius:   '11px',
        boxShadow: [
          '0 8px 32px rgba(0,0,0,0.55)',
          '0 1px 0 rgba(255,255,255,0.06) inset',
          '0 0 0 0.5px rgba(0,210,200,0.06) inset',
        ].join(','),
        padding:        '12px 8px 12px 8px',
        overflow:       'hidden',
        boxSizing:      'border-box',
      }}>

        {/* ── Header ── */}
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            '3px',
          marginBottom:   '10px',
          flexShrink:     0,
        }}>
          {/* Glow dot */}
          <div style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   'linear-gradient(135deg,#00ffe0,#0077ff)',
            boxShadow:    '0 0 8px rgba(0,230,200,0.8), 0 0 2px rgba(0,230,200,0.5)',
          }} />
          <span style={{
            fontSize:      '7.5px',
            fontWeight:    '700',
            fontFamily:    "'Inter','Segoe UI',sans-serif",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         '#5ee8df',
            lineHeight:    1,
            textAlign:     'center',
          }}>
            {config.label}
          </span>
          {config.units && (
            <span style={{
              fontSize:  '7px',
              color:     'rgba(120,180,210,0.60)',
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}>
              {config.units}
            </span>
          )}
        </div>

        {/* ── Scale / gradient ── */}
        {config.showGradient && scaleMax > 0 ? (
          <div style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'row',
            gap:            '5px',
            minHeight:      0,
            alignItems:     'stretch',
          }}>
            <GradientBar />
            <TickRuler majorTicks={majorTicks} subCount={4} scaleMax={scaleMax} />
          </div>

        ) : !config.showGradient ? (
          /* Currents fallback */
          <div style={{
            flex:           1,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <span style={{
              fontSize:   '8px',
              color:      'rgba(160,210,230,0.55)',
              letterSpacing: '0.05em',
              textAlign:  'center',
              lineHeight: 1.6,
            }}>
              Vector<br/>display
            </span>
          </div>
        ) : null}

        {/* Bottom shimmer line */}
        <div style={{
          flexShrink:  0,
          height:      '1px',
          marginTop:   '8px',
          background:  'linear-gradient(90deg, transparent, rgba(0,210,200,0.25), transparent)',
        }} />
      </div>
    </div>
  );
}
