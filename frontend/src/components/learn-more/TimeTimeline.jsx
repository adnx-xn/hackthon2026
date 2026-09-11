import React, { useState, useEffect } from 'react';

export default function TimeTimeline({
  title = 'WATCH IT CHANGE',
  description = "Ocean temperature can also be explored across different timestamps within the available model data. Moving through time allows users to observe how temperature patterns evolve.",
  timestamps = [
    { month: 'JAN', phase: 'Northeast Monsoon', anomaly: '-0.8 °C', event: 'Winter cooling across Northern Arabian Sea & Persian Gulf' },
    { month: 'MAR', phase: 'Spring Transition', anomaly: '+1.2 °C', event: 'Pre-monsoon solar heating creates maximum SST in Bay of Bengal' },
    { month: 'JUN', phase: 'Southwest Monsoon Onset', anomaly: '-1.4 °C', event: 'Somali Current accelerates northward with intense coastal upwelling' },
    { month: 'SEP', phase: 'Peak Monsoon Wind Stress', anomaly: '-0.5 °C', event: 'Strong mixing deepens mixed layer; Wyrtki Jets transfer warm water east' },
    { month: 'DEC', phase: 'Winter Convective Mixing', anomaly: '-0.2 °C', event: 'Reversal of surface currents; thermohaline readjustment' },
  ]
}) {
  const [activeIdx, setActiveIdx] = useState(2); // default June
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % timestamps.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isPlaying, timestamps.length]);

  const active = timestamps[activeIdx];

  return (
    <section className="w-full py-[50px] max-w-[1240px] mx-auto px-[24px] sm:px-[36px]">
      <div className="p-[32px] sm:p-[44px] rounded-[24px] border border-[rgba(98,217,255,0.2)] bg-[rgba(3,16,33,0.68)] backdrop-blur-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
        {/* Header */}
        <div className="max-w-[800px] mb-[36px]">
          <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[2px] uppercase mb-[10px]">
            Temporal Dimension & Dynamics
          </div>
          <h2 className="m-0 text-[28px] sm:text-[36px] font-bold text-white tracking-[-1px]">
            {title}
          </h2>
          <p className="mt-[16px] text-[rgba(215,235,248,0.78)] text-[15px] sm:text-[16px] leading-[1.8]">
            {description}
          </p>
        </div>

        {/* 2024 Year & Scrubber Header */}
        <div className="flex items-center justify-between flex-wrap gap-[16px] mb-[28px] p-[16px] rounded-[16px] bg-[rgba(2,10,22,0.6)] border border-[rgba(255,255,255,0.07)]">
          <div className="flex items-center gap-[12px]">
            <span className="text-[18px] font-bold text-white tracking-[1px]">2024</span>
            <span className="px-[8px] py-[3px] rounded-md bg-[rgba(56,189,248,0.15)] text-[#38bdf8] text-[11px] font-mono">
              ANNUAL MONSOON CYCLE
            </span>
          </div>

          <div className="flex items-center gap-[12px]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-[8px] px-[16px] py-[8px] rounded-[10px] bg-[rgba(14,165,233,0.2)] border border-[rgba(98,217,255,0.3)] text-white text-[13px] font-semibold cursor-pointer hover:bg-[rgba(14,165,233,0.35)] transition-all"
            >
              <span>{isPlaying ? '⏸ Pause' : '▶ Play Animation'}</span>
            </button>
            <span className="text-[12px] text-[rgba(180,210,230,0.55)] font-mono">
              Step {activeIdx + 1} of {timestamps.length}
            </span>
          </div>
        </div>

        {/* The Timeline Track Component */}
        <div className="relative my-[30px] px-[20px] sm:px-[40px]">
          {/* Background Track Line */}
          <div className="absolute top-1/2 left-[40px] right-[40px] -translate-y-1/2 h-[3px] bg-[rgba(255,255,255,0.12)] rounded-full" />
          
          {/* Progress Active Glow Line */}
          <div
            className="absolute top-1/2 left-[40px] -translate-y-1/2 h-[3px] bg-[linear-gradient(90deg,#0ea5e9,#38bdf8)] rounded-full transition-all duration-500 shadow-[0_0_12px_#38bdf8]"
            style={{
              width: `calc(${(activeIdx / (timestamps.length - 1)) * 100}% - 40px)`
            }}
          />

          {/* Timeline Nodes */}
          <div className="relative flex justify-between items-center">
            {timestamps.map((item, idx) => {
              const isActive = activeIdx === idx;
              const isPast = idx < activeIdx;

              return (
                <div
                  key={item.month}
                  onClick={() => {
                    setActiveIdx(idx);
                    setIsPlaying(false);
                  }}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  {/* Glowing Node Circle */}
                  <div
                    className={`w-[28px] h-[28px] sm:w-[36px] sm:h-[36px] rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                      isActive
                        ? 'border-[#38bdf8] bg-[rgba(14,165,233,0.9)] shadow-[0_0_20px_#38bdf8] scale-110'
                        : isPast
                        ? 'border-[#0284c7] bg-[rgba(2,132,199,0.4)]'
                        : 'border-[rgba(255,255,255,0.2)] bg-[#020713] group-hover:border-[rgba(98,217,255,0.6)]'
                    }`}
                  >
                    <span className="w-[8px] h-[8px] rounded-full bg-white" />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`mt-[12px] text-[13px] sm:text-[15px] font-bold tracking-[1px] transition-colors ${
                      isActive ? 'text-[#38bdf8]' : 'text-[rgba(215,235,248,0.65)] group-hover:text-white'
                    }`}
                  >
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Time-Step Callout Card */}
        <div className="mt-[36px] p-[24px] sm:p-[28px] rounded-[18px] border border-[rgba(56,189,248,0.25)] bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(3,16,33,0.7))] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[20px]">
          <div>
            <div className="flex items-center gap-[10px] text-[#38bdf8] text-[12px] font-mono uppercase tracking-[1px]">
              <span className="w-[8px] h-[8px] rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
              {active.phase} (2024 · {active.month})
            </div>
            <div className="text-[17px] font-semibold text-white mt-[6px]">
              {active.event}
            </div>
          </div>

          <div className="flex items-center gap-[16px] shrink-0">
            <div className="px-[16px] py-[8px] rounded-[10px] bg-[rgba(2,10,22,0.6)] border border-[rgba(255,255,255,0.08)] text-right">
              <span className="text-[11px] text-[rgba(180,210,230,0.6)] block">Thermal Anomaly</span>
              <span className="text-[16px] font-mono font-bold text-[#63d9ff]">{active.anomaly}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
