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
    <div className="flex flex-col gap-[10px]">
      <h4>Colormap Controls</h4>
      
      <div>
        <label>Preset Palette: </label>
        <select value={state.colormapPalette} onChange={handlePaletteChange} className="w-full py-[9px] px-[11px] rounded-[8px] border border-[rgba(71,85,105,0.55)] bg-[rgba(2,12,27,0.72)] text-[#f8fafc] font-[inherit] text-[0.82rem] outline-none transition-all duration-200 ease-out hover:border-[rgba(56,189,248,0.3)] focus:border-[#38bdf8] focus:bg-[rgba(4,22,42,0.9)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.08)]">
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
          className="h-[20px] rounded-[4px] relative mt-[10px] cursor-crosshair select-none"
          style={{ background: gradientString }}
        >
          {activeStops.map((stop, i) => (
            <div 
              key={i}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onDoubleClick={() => removeStop(i)}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[24px] bg-[#fff] border border-[#000] rounded-[2px] flex justify-center items-center ${
                i === 0 || i === activeStops.length - 1 ? 'cursor-default' : 'cursor-ew-resize'
              }`}
              style={{
                left: `${stop.position * 100}%`,
              }}
            >
              <input 
                type="color"
                value={colorToHex(stop.color)}
                onChange={(e) => updateStopColor(i, e.target.value)}
                className="w-full h-full opacity-0 cursor-pointer"
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
          className="w-full py-[9px] px-[11px] rounded-[8px] border border-[rgba(71,85,105,0.55)] bg-[rgba(2,12,27,0.72)] text-[#f8fafc] font-[inherit] text-[0.82rem] outline-none transition-all duration-200 ease-out hover:border-[rgba(56,189,248,0.3)] focus:border-[#38bdf8] focus:bg-[rgba(4,22,42,0.9)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.08)]"
        >
          <option value="linear">Linear</option>
          <option value="log">Log</option>
        </select>
      </div>

      <div className="flex gap-[10px]">
        <div>
          <label>Min (auto = empty): </label>
          <input 
            type="number" 
            className="w-[80px] py-[9px] px-[11px] rounded-[8px] border border-[rgba(71,85,105,0.55)] bg-[rgba(2,12,27,0.72)] text-[#f8fafc] font-[inherit] text-[0.82rem] outline-none transition-all duration-200 ease-out hover:border-[rgba(56,189,248,0.3)] focus:border-[#38bdf8] focus:bg-[rgba(4,22,42,0.9)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.08)]"
            value={state.colormapMin === null ? '' : state.colormapMin} 
            onChange={handleMinChange}
          />
        </div>
        <div>
          <label>Max (auto = empty): </label>
          <input 
            type="number" 
            className="w-[80px] py-[9px] px-[11px] rounded-[8px] border border-[rgba(71,85,105,0.55)] bg-[rgba(2,12,27,0.72)] text-[#f8fafc] font-[inherit] text-[0.82rem] outline-none transition-all duration-200 ease-out hover:border-[rgba(56,189,248,0.3)] focus:border-[#38bdf8] focus:bg-[rgba(4,22,42,0.9)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.08)]"
            value={state.colormapMax === null ? '' : state.colormapMax} 
            onChange={handleMaxChange}
          />
        </div>
      </div>
    </div>
  );
}
