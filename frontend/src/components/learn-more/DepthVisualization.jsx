import React, { useState } from 'react';

export default function DepthVisualization({
  parameter = 'temperature',
  title = 'DIVE DEEPER',
  description = "Temperature is not the same at every depth. With depth-based navigation, users can select specific layers of the ocean and examine the corresponding temperature field. Vertical exaggeration further helps make changes beneath the surface visually distinguishable.",
  layers = [
    { depth: 'Surface (0 m)', temp: '29.8 °C', salinity: '34.2 PSU', velocity: '0.85 m/s', desc: 'Solar-heated mixed layer in active atmospheric exchange' },
    { depth: '100 m', temp: '24.5 °C', salinity: '35.1 PSU', velocity: '0.45 m/s', desc: 'Top of the seasonal thermocline with rapid stratification' },
    { depth: '250 m', temp: '15.2 °C', salinity: '35.4 PSU', velocity: '0.22 m/s', desc: 'Permanent thermocline barrier between warm surface and abyssal water' },
    { depth: '500 m', temp: '9.8 °C', salinity: '34.9 PSU', velocity: '0.12 m/s', desc: 'Intermediate water mass flowing through equatorial channels' },
    { depth: '1000 m', temp: '4.6 °C', salinity: '34.8 PSU', velocity: '0.05 m/s', desc: 'Abyssal deep cold ocean characterized by slow thermohaline drift' },
  ]
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [verticalExaggeration, setVerticalExaggeration] = useState(5);

  const activeLayer = layers[selectedIdx];

  return (
    <section className="w-full py-[50px] max-w-[1240px] mx-auto px-[24px] sm:px-[36px]">
      <div className="p-[32px] sm:p-[44px] rounded-[24px] border border-[rgba(98,217,255,0.2)] bg-[rgba(3,16,33,0.68)] backdrop-blur-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="max-w-[800px] mb-[36px]">
          <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[2px] uppercase mb-[10px]">
            Vertical Stratification & Bathymetry
          </div>
          <h2 className="m-0 text-[28px] sm:text-[36px] font-bold text-white tracking-[-1px]">
            {title}
          </h2>
          <p className="mt-[16px] text-[rgba(215,235,248,0.78)] text-[15px] sm:text-[16px] leading-[1.8]">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-[36px] items-center">
          {/* LEFT: 3D Layered Ocean Planes Representation */}
          <div className="relative p-[24px] rounded-[20px] border border-[rgba(120,190,220,0.18)] bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.08),rgba(2,10,24,0.7))] min-h-[380px] flex flex-col justify-between overflow-hidden">
            {/* Ambient depth grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(2,6,18,0.85)_100%)] pointer-events-none" />

            <div className="relative z-10 flex justify-between items-center text-[12px] font-mono text-[rgba(180,215,238,0.75)] mb-[16px]">
              <span>VERTICAL SLICE STRATIFICATION</span>
              <span className="text-[#38bdf8]">VE: {verticalExaggeration}×</span>
            </div>

            {/* Stacked 3D Perspective Depth Planes */}
            <div className="relative z-10 flex flex-col gap-[12px] my-auto py-[10px]">
              {layers.map((layer, idx) => {
                const isSelected = selectedIdx === idx;
                // Color changes from surface warm to deep cold
                const colors = ['#ef4444', '#f97316', '#06b6d4', '#0284c7', '#1e3a8a'];
                const planeColor = colors[idx] || '#0284c7';

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedIdx(idx)}
                    className={`relative p-[14px] sm:p-[16px] rounded-[14px] cursor-pointer transition-all duration-300 border flex items-center justify-between ${
                      isSelected
                        ? 'border-[#38bdf8] bg-[rgba(14,165,233,0.22)] shadow-[0_0_24px_rgba(56,189,248,0.3)] translate-x-[8px]'
                        : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:bg-[rgba(255,255,255,0.05)] hover:translate-x-[4px]'
                    }`}
                    style={{
                      transform: `perspective(600px) rotateX(${15 - idx * 2}deg) translateZ(${isSelected ? 15 : 0}px)`,
                    }}
                  >
                    <div className="flex items-center gap-[12px]">
                      <span
                        className="w-[12px] h-[12px] rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ backgroundColor: planeColor, color: planeColor }}
                      />
                      <span className="font-semibold text-white text-[14px]">
                        {layer.depth}
                      </span>
                    </div>

                    <div className="flex items-center gap-[16px]">
                      <span className="font-mono text-[13px] text-[#63d9ff] font-medium">
                        {parameter === 'temperature' ? layer.temp : parameter === 'salinity' ? layer.salinity : layer.velocity}
                      </span>
                      <span className={`text-[12px] ${isSelected ? 'text-[#38bdf8]' : 'text-transparent'}`}>
                        ▶
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vertical Exaggeration Slider Control */}
            <div className="relative z-10 mt-[20px] pt-[16px] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-[16px]">
              <span className="text-[12px] text-[rgba(200,225,242,0.7)] font-medium">
                Adjust Vertical Exaggeration:
              </span>
              <input
                type="range"
                min="1"
                max="10"
                value={verticalExaggeration}
                onChange={(e) => setVerticalExaggeration(Number(e.target.value))}
                className="w-[140px] cursor-pointer accent-[#38bdf8]"
              />
            </div>
          </div>

          {/* RIGHT: Selected Depth Analysis Card */}
          <div className="p-[28px] sm:p-[32px] rounded-[20px] border border-[rgba(98,217,255,0.22)] bg-[linear-gradient(145deg,rgba(14,165,233,0.12),rgba(3,16,33,0.75))] flex flex-col justify-center">
            <div className="flex items-center gap-[8px] text-[#38bdf8] text-[11px] font-mono tracking-[1.5px] uppercase mb-[12px]">
              <span className="w-[6px] h-[6px] rounded-full bg-[#38bdf8]" />
              Active Slice Profile
            </div>

            <h3 className="m-0 text-[26px] font-bold text-white tracking-[-0.5px]">
              {activeLayer.depth}
            </h3>

            <div className="mt-[20px] grid grid-cols-2 gap-[14px]">
              <div className="p-[14px] rounded-[12px] bg-[rgba(2,10,22,0.6)] border border-[rgba(255,255,255,0.07)]">
                <span className="text-[11px] text-[rgba(180,210,230,0.6)] block mb-[4px]">Temperature</span>
                <span className="text-[20px] font-mono font-bold text-[#ef4444]">{activeLayer.temp}</span>
              </div>
              <div className="p-[14px] rounded-[12px] bg-[rgba(2,10,22,0.6)] border border-[rgba(255,255,255,0.07)]">
                <span className="text-[11px] text-[rgba(180,210,230,0.6)] block mb-[4px]">Salinity</span>
                <span className="text-[20px] font-mono font-bold text-[#38bdf8]">{activeLayer.salinity}</span>
              </div>
            </div>

            <p className="mt-[20px] text-[14px] leading-[1.8] text-[rgba(215,235,248,0.75)]">
              {activeLayer.desc}
            </p>

            <div className="mt-[24px] p-[14px] rounded-[12px] bg-[rgba(56,189,248,0.08)] border border-[rgba(56,189,248,0.2)] text-[12px] text-[#7dd3fc]">
              💡 <span className="font-semibold text-white">Scientific Insight:</span> In the 3D scene, vertical exaggeration magnifies subtle vertical temperature gradients without changing scientific numerical measurements.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
