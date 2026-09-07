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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h4>Colormap Controls</h4>
      
      <div>
        <label>Preset Palette: </label>
        <select value={state.colormapPalette} onChange={handlePaletteChange}>
          <option value="viridis">Viridis</option>
          <option value="plasma">Plasma</option>
          <option value="coolwarm">Coolwarm</option>
          <option value="jet">Jet</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div>
        <label>Gradient (Click track to add, Double-click thumb to remove, Drag to move):</label>
        <div 
          ref={trackRef}
          onPointerDown={handleTrackClick}
          style={{ 
            height: '20px', 
            background: gradientString, 
            borderRadius: '4px',
            position: 'relative',
            marginTop: '10px',
            cursor: 'crosshair',
            userSelect: 'none'
          }}
        >
          {activeStops.map((stop, i) => (
            <div 
              key={i}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onDoubleClick={() => removeStop(i)}
              style={{
                position: 'absolute',
                left: `${stop.position * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '24px',
                background: '#fff',
                border: '1px solid #000',
                borderRadius: '2px',
                cursor: (i === 0 || i === activeStops.length - 1) ? 'default' : 'ew-resize',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <input 
                type="color"
                value={colorToHex(stop.color)}
                onChange={(e) => updateStopColor(i, e.target.value)}
                style={{
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label>Scale: </label>
        <select 
          value={state.colormapScale} 
          onChange={(e) => dispatch({ type: 'SET_COLORMAP_SCALE', payload: e.target.value })}
        >
          <option value="linear">Linear</option>
          <option value="log">Log</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <div>
          <label>Min (auto = empty): </label>
          <input 
            type="number" 
            style={{ width: '80px' }}
            value={state.colormapMin === null ? '' : state.colormapMin} 
            onChange={handleMinChange}
          />
        </div>
        <div>
          <label>Max (auto = empty): </label>
          <input 
            type="number" 
            style={{ width: '80px' }}
            value={state.colormapMax === null ? '' : state.colormapMax} 
            onChange={handleMaxChange}
          />
        </div>
      </div>
    </div>
  );
}
