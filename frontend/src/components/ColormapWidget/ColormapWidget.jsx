import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { PALETTES } from '../../utils/colormap';

function colorToHex(color) {
  return '#' + color.getHexString();
}

function hexToColor(hex) {
  return new THREE.Color(hex);
}

export default function ColormapWidget() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const trackRef = useRef(null);
  
  // Ensure we have active stops. Fallback to viridis if null.
  const activeStops = state.colorStops || PALETTES['viridis'].map((c, i, arr) => ({
    position: i / (arr.length - 1),
    color: c
  }));

  const handleMinChange = (e) => {
    const val = e.target.value;
    dispatch({ type: 'SET_COLORMAP_MIN', payload: val === '' ? null : Number(val) });
  };

  const handleMaxChange = (e) => {
    const val = e.target.value;
    dispatch({ type: 'SET_COLORMAP_MAX', payload: val === '' ? null : Number(val) });
  };

  const handlePaletteChange = (e) => {
    const paletteName = e.target.value;
    dispatch({ type: 'SET_COLORMAP_PALETTE', payload: paletteName });
    
    // Initialize color stops from the preset palette
    const presetColors = PALETTES[paletteName] || PALETTES['viridis'];
    const newStops = presetColors.map((c, i, arr) => ({
      position: i / (arr.length - 1),
      color: c.clone()
    }));
    dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
  };

  // Generate CSS gradient string for the track background
  const gradientString = `linear-gradient(to right, ${activeStops.map(s => `${colorToHex(s.color)} ${s.position * 100}%`).join(', ')})`;

  // Add stop on track click
  const handleTrackClick = (e) => {
    if (e.target !== trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    // Simple interpolation for the initial color of the new stop
    let color = new THREE.Color(0xffffff);
    for (let i = 0; i < activeStops.length - 1; i++) {
      if (pos >= activeStops[i].position && pos <= activeStops[i+1].position) {
        const range = activeStops[i+1].position - activeStops[i].position;
        const frac = (pos - activeStops[i].position) / range;
        color = activeStops[i].color.clone().lerp(activeStops[i+1].color, frac);
        break;
      }
    }
    
    const newStops = [...activeStops, { position: pos, color }].sort((a, b) => a.position - b.position);
    dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
  };

  const updateStopColor = (index, newHex) => {
    const newStops = [...activeStops];
    newStops[index] = { ...newStops[index], color: hexToColor(newHex) };
    dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
  };

  const removeStop = (index) => {
    if (activeStops.length <= 2) return; // Need at least 2 stops
    const newStops = activeStops.filter((_, i) => i !== index);
    dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
  };

  const handlePointerDown = (e, index) => {
    e.stopPropagation();
    // Don't allow moving the very first (0.0) or very last (1.0) stop
    if (index === 0 || index === activeStops.length - 1) return;

    const onPointerMove = (moveEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      let pos = (moveEvent.clientX - rect.left) / rect.width;
      
      // Clamp between adjacent stops
      const prevPos = activeStops[index - 1].position;
      const nextPos = activeStops[index + 1].position;
      pos = Math.max(prevPos + 0.01, Math.min(nextPos - 0.01, pos));
      
      const newStops = [...activeStops];
      newStops[index] = { ...newStops[index], position: pos };
      dispatch({ type: 'SET_COLOR_STOPS', payload: newStops });
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(56,189,248,0.12)',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="8" cy="9" r="1.5" fill="#38bdf8" stroke="none"/>
          <circle cx="15" cy="9" r="1.5" fill="#38bdf8" stroke="none"/>
          <circle cx="12" cy="15" r="1.5" fill="#38bdf8" stroke="none"/>
        </svg>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
          Colormap Controls
        </span>
      </div>

      {/* Preset Palette */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '0.69rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
          Preset Palette
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={state.colormapPalette}
            onChange={handlePaletteChange}
            style={{
              width: '100%', height: '34px', appearance: 'none', WebkitAppearance: 'none',
              padding: '0 28px 0 10px', background: 'rgba(3,14,30,0.55)',
              border: '1px solid rgba(56,189,248,0.18)', borderRadius: '8px',
              color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 500,
              outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="viridis">Viridis</option>
            <option value="plasma">Plasma</option>
            <option value="coolwarm">Coolwarm</option>
            <option value="jet">Jet</option>
            <option value="custom">Custom</option>
          </select>
          <svg style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Gradient track */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '0.69rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
          Gradient{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', color: '#475569', fontSize: '0.63rem' }}>
            · click to add · dbl-click to remove
          </span>
        </label>
        <div
          ref={trackRef}
          onPointerDown={handleTrackClick}
          style={{
            height: '16px', background: gradientString, borderRadius: '6px',
            position: 'relative', cursor: 'crosshair', userSelect: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.35)',
          }}
        >
          {activeStops.map((stop, i) => (
            <div
              key={i}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onDoubleClick={() => removeStop(i)}
              style={{
                position: 'absolute', left: `${stop.position * 100}%`, top: '50%',
                transform: 'translate(-50%, -50%)', width: '12px', height: '20px',
                background: 'rgba(12,28,52,0.9)', border: '1.5px solid rgba(56,189,248,0.60)',
                borderRadius: '3px', cursor: (i === 0 || i === activeStops.length - 1) ? 'default' : 'ew-resize',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 0 5px rgba(56,189,248,0.25)',
              }}
            >
              <input
                type="color"
                value={colorToHex(stop.color)}
                onChange={(e) => updateStopColor(i, e.target.value)}
                style={{ width: '100%', height: '100%', opacity: 0, cursor: 'pointer', padding: 0, border: 'none' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Scale type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <label style={{ fontSize: '0.69rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
          Scale
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={state.colormapScale}
            onChange={(e) => dispatch({ type: 'SET_COLORMAP_SCALE', payload: e.target.value })}
            style={{
              width: '100%', height: '34px', appearance: 'none', WebkitAppearance: 'none',
              padding: '0 28px 0 10px', background: 'rgba(3,14,30,0.55)',
              border: '1px solid rgba(56,189,248,0.18)', borderRadius: '8px',
              color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 500,
              outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <option value="linear">Linear</option>
            <option value="log">Log</option>
          </select>
          <svg style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Min / Max */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { label: 'Min', value: state.colormapMin, handler: handleMinChange },
          { label: 'Max', value: state.colormapMax, handler: handleMaxChange },
        ].map(({ label, value, handler }) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
              {label}
            </label>
            <input
              type="number"
              placeholder="auto"
              value={value === null ? '' : value}
              onChange={handler}
              style={{
                width: '100%', height: '32px', padding: '0 8px',
                background: 'rgba(3,14,30,0.55)', border: '1px solid rgba(56,189,248,0.16)',
                borderRadius: '7px', color: '#e2e8f0', fontSize: '0.77rem',
                outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
