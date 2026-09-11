import React, { useState } from 'react';

export default function ModelObservation({
  parameter = 'temperature',
  title = 'MODEL MEETS OBSERVATION',
  description = "Temperature is also available through observational data from instruments such as Argo floats and gliders. These observations can be explored alongside model fields, providing a way to examine temperature profiles and compare modeled conditions with measurements.",
}) {
  const [activeTab, setActiveTab] = useState('split');

  // Simulated Argo Float & Glider profile data points
  const profilePoints = [
    { depth: 0, model: 29.8, obs: 29.6 },
    { depth: 50, model: 28.2, obs: 27.9 },
    { depth: 100, model: 24.5, obs: 23.8 },
    { depth: 200, model: 18.0, obs: 17.5 },
    { depth: 300, model: 13.5, obs: 13.2 },
    { depth: 500, model: 9.8, obs: 9.9 },
    { depth: 750, model: 6.8, obs: 6.7 },
    { depth: 1000, model: 4.6, obs: 4.5 },
  ];

  return (
    <section className="w-full py-[50px] max-w-[1240px] mx-auto px-[24px] sm:px-[36px]">
      <div className="p-[32px] sm:p-[44px] rounded-[24px] border border-[rgba(98,217,255,0.2)] bg-[rgba(3,16,33,0.68)] backdrop-blur-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="max-w-[800px] mb-[36px]">
          <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[2px] uppercase mb-[10px]">
            Data Assimilation & In-Situ Ground Truth
          </div>
          <h2 className="m-0 text-[28px] sm:text-[36px] font-bold text-white tracking-[-1px]">
            {title}
          </h2>
          <p className="mt-[16px] text-[rgba(215,235,248,0.78)] text-[15px] sm:text-[16px] leading-[1.8]">
            {description}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-[8px] mb-[28px]">
          {['split', 'model', 'observation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-[16px] py-[8px] rounded-[10px] text-[12px] font-semibold uppercase tracking-[1px] cursor-pointer transition-all border ${
                activeTab === tab
                  ? 'border-[#38bdf8] bg-[rgba(14,165,233,0.25)] text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[rgba(200,225,242,0.6)] hover:bg-[rgba(255,255,255,0.05)]'
              }`}
            >
              {tab === 'split' ? 'SPLIT COMPARISON' : tab === 'model' ? 'NUMERICAL MODEL' : 'IN-SITU OBSERVATIONS'}
            </button>
          ))}
        </div>

        {/* Split Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
          {/* LEFT: Numerical Model Data Domain */}
          {(activeTab === 'split' || activeTab === 'model') && (
            <div className="p-[28px] rounded-[18px] border border-[rgba(14,165,233,0.25)] bg-[linear-gradient(145deg,rgba(14,165,233,0.08),rgba(2,10,22,0.7))] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-[16px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="w-[10px] h-[10px] rounded-full bg-[#0ea5e9] shadow-[0_0_10px_#0ea5e9]" />
                    <h3 className="m-0 text-[18px] font-bold text-white">
                      NUMERICAL MODEL DATA
                    </h3>
                  </div>
                  <span className="px-[8px] py-[3px] rounded bg-[rgba(14,165,233,0.15)] text-[#38bdf8] font-mono text-[11px]">
                    NetCDF / Copernicus
                  </span>
                </div>

                <p className="text-[14px] leading-[1.7] text-[rgba(215,235,248,0.75)] m-0">
                  Continuous 3D ocean state simulated by hydrodynamical numerical models. Provides continuous spatial coverage across the entire Indian Ocean basin, from surface boundary layers to the ocean floor.
                </p>

                {/* Simulated scalar field preview */}
                <div className="mt-[20px] p-[16px] rounded-[12px] bg-[rgba(2,6,18,0.65)] border border-[rgba(255,255,255,0.06)]">
                  <div className="text-[11px] font-mono text-[rgba(180,210,230,0.6)] mb-[8px]">
                    MODEL ATTRIBUTES:
                  </div>
                  <div className="grid grid-cols-2 gap-[8px] text-[12px]">
                    <div><span className="text-[rgba(180,210,230,0.5)]">Source:</span> <span className="text-white font-medium">Ocean Reanalysis</span></div>
                    <div><span className="text-[rgba(180,210,230,0.5)]">Resolution:</span> <span className="text-white font-medium">0.083° (~9 km)</span></div>
                    <div><span className="text-[rgba(180,210,230,0.5)]">Grid Vertices:</span> <span className="text-white font-medium">40,000 pts</span></div>
                    <div><span className="text-[rgba(180,210,230,0.5)]">Layers:</span> <span className="text-white font-medium">50 depth levels</span></div>
                  </div>
                </div>
              </div>

              <div className="mt-[24px] flex items-center justify-between text-[12px] text-[#38bdf8] font-mono">
                <span>Spatial Continuity: 100%</span>
                <span>Temporal Step: 1 Day</span>
              </div>
            </div>
          )}

          {/* RIGHT: Observational Instruments & Depth Profile */}
          {(activeTab === 'split' || activeTab === 'observation') && (
            <div className="p-[28px] rounded-[18px] border border-[rgba(34,197,94,0.25)] bg-[linear-gradient(145deg,rgba(34,197,94,0.08),rgba(2,10,22,0.7))] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-[16px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="w-[10px] h-[10px] rounded-full bg-[#22c55e] shadow-[0_0_10px_#22c55e]" />
                    <h3 className="m-0 text-[18px] font-bold text-white">
                      OBSERVATION PLATFORMS
                    </h3>
                  </div>
                  <span className="px-[8px] py-[3px] rounded bg-[rgba(34,197,94,0.15)] text-[#4ade80] font-mono text-[11px]">
                    In-Situ Profilers
                  </span>
                </div>

                <div className="flex items-center gap-[16px] mb-[16px]">
                  <div className="flex items-center gap-[8px] text-[13px] text-white">
                    <span className="w-[8px] h-[8px] rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                    Argo Floats
                  </div>
                  <div className="flex items-center gap-[8px] text-[13px] text-white">
                    <span className="w-[8px] h-[8px] rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
                    Underwater Gliders
                  </div>
                  <div className="flex items-center gap-[8px] text-[13px] text-white">
                    <span className="w-[8px] h-[8px] rounded-full bg-[#ec4899] shadow-[0_0_8px_#ec4899]" />
                    Moored Buoys
                  </div>
                </div>

                <p className="text-[14px] leading-[1.7] text-[rgba(215,235,248,0.75)] m-0">
                  Autonomous floating profilers that descend to 2,000 metres and surface every 10 days, recording high-precision vertical CTD (Conductivity, Temperature, Depth) measurements.
                </p>

                {/* Profile Chart Representation */}
                <div className="mt-[20px] p-[16px] rounded-[12px] bg-[rgba(2,6,18,0.65)] border border-[rgba(255,255,255,0.06)]">
                  <div className="flex justify-between items-center text-[11px] font-mono text-[rgba(180,210,230,0.6)] mb-[8px]">
                    <span>DEPTH (m) vs TEMPERATURE (°C)</span>
                    <span className="text-[#4ade80]">Δ &lt; 0.3 °C (Excellent correlation)</span>
                  </div>

                  <div className="space-y-[4px]">
                    {profilePoints.slice(0, 4).map((pt) => (
                      <div key={pt.depth} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[rgba(200,225,242,0.6)] w-[60px]">{pt.depth} m</span>
                        <div className="flex-1 mx-[12px] h-[4px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden flex">
                          <div className="bg-[#0ea5e9] h-full" style={{ width: `${(pt.model / 32) * 100}%` }} />
                        </div>
                        <span className="text-[#38bdf8] mr-[10px]">Model: {pt.model}°</span>
                        <span className="text-[#4ade80]">Obs: {pt.obs}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-[24px] flex items-center justify-between text-[12px] text-[#4ade80] font-mono">
                <span>In-Situ Calibration: Active</span>
                <span>Instrument ID: ARGO_IN_290123</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
