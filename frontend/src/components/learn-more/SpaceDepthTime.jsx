import React, { useState } from 'react';

export default function SpaceDepthTime() {
  const [activeConcept, setActiveConcept] = useState('space');

  const concepts = [
    {
      id: 'space',
      symbol: '🌐',
      title: 'SPACE',
      tagline: 'Horizontal Ocean Domain',
      metric: '40°E–105°E · 28°N–18°S',
      points: [
        'Georeferenced spherical projection mapped to 3D Earth coordinates',
        'Detailed resolution across Arabian Sea, Bay of Bengal, and Equatorial Basin',
        'Spatial boundary currents, coastal upwelling fronts, and thermal warm pools',
      ],
      color: '#38bdf8',
    },
    {
      id: 'depth',
      symbol: '📉',
      title: 'DEPTH',
      tagline: 'Vertical Stratification',
      metric: '0 m to 1,000+ m',
      points: [
        'Discrete depth-slice extraction across thermocline and abyssal zones',
        'Vertical exaggeration controls to resolve subtle subsurface stratification',
        'Curtain wall visualizer revealing mixed layer vs deep ocean boundaries',
      ],
      color: '#0ea5e9',
    },
    {
      id: 'time',
      symbol: '⏱️',
      title: 'TIME',
      tagline: 'Temporal Evolution',
      metric: 'Monthly & Seasonal Steps',
      points: [
        'Interactive timestamp navigation tracking seasonal monsoon oscillations',
        'Non-overlapping fetch cycle ensuring smooth time-step playback',
        'Observation of dynamic current reversals and thermocline depth changes',
      ],
      color: '#2563eb',
    },
  ];

  return (
    <section className="w-full py-[50px] max-w-[1240px] mx-auto px-[24px] sm:px-[36px]">
      <div className="p-[32px] sm:p-[48px] rounded-[24px] border border-[rgba(98,217,255,0.25)] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.12),rgba(2,10,24,0.75))] backdrop-blur-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-[44px]">
          <div className="inline-flex items-center gap-[8px] px-[14px] py-[5px] rounded-full bg-[rgba(56,189,248,0.1)] border border-[rgba(56,189,248,0.25)] text-[#38bdf8] text-[11px] font-mono uppercase tracking-[2px] mb-[14px]">
            4D Scientific Data Continuum
          </div>
          <h2 className="m-0 text-[32px] sm:text-[44px] font-extrabold text-white tracking-[-1.5px]">
            SPACE <span className="text-[#38bdf8]">×</span> DEPTH <span className="text-[#38bdf8]">×</span> TIME
          </h2>
          <p className="mt-[14px] text-[rgba(215,235,248,0.8)] text-[16px] sm:text-[17px] leading-[1.7]">
            A single temperature field becomes a dynamic view of the ocean.
          </p>
        </div>

        {/* The 3 Pillars Connected by Glowing Lines */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-[24px] lg:gap-[32px] items-stretch">
          {/* Animated Connecting Line between cards on desktop */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[2px] bg-[linear-gradient(90deg,rgba(56,189,248,0.2),rgba(56,189,248,0.8),rgba(56,189,248,0.2))] -translate-y-1/2 pointer-events-none -z-0" />

          {concepts.map((item) => {
            const isSelected = activeConcept === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setActiveConcept(item.id)}
                className={`relative z-10 p-[28px] rounded-[20px] cursor-pointer transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#38bdf8] bg-[rgba(14,165,233,0.18)] shadow-[0_0_30px_rgba(56,189,248,0.3)] -translate-y-[6px]'
                    : 'border-[rgba(120,190,220,0.15)] bg-[rgba(3,16,33,0.7)] hover:bg-[rgba(5,24,48,0.8)] hover:-translate-y-[2px]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-[16px]">
                    <span className="text-[28px]">{item.symbol}</span>
                    <span className="px-[8px] py-[3px] rounded-md bg-[rgba(255,255,255,0.06)] font-mono text-[11px] text-[rgba(200,225,242,0.7)]">
                      {item.metric}
                    </span>
                  </div>

                  <h3 className="m-0 text-[24px] font-bold text-white tracking-[-0.5px]">
                    {item.title}
                  </h3>
                  <div className="text-[#63d9ff] text-[13px] font-semibold mt-[2px] mb-[16px]">
                    {item.tagline}
                  </div>

                  <ul className="space-y-[10px] text-[13px] leading-[1.6] text-[rgba(215,235,248,0.72)] pl-[16px] m-0">
                    {item.points.map((pt, pIdx) => (
                      <li key={pIdx} className="list-disc marker:text-[#38bdf8]">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-[24px] pt-[14px] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[11px] text-[#38bdf8] font-mono">
                  <span>{isSelected ? 'ACTIVE VIEW' : 'CLICK TO FOCUS'}</span>
                  <span>{isSelected ? '●' : '○'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
