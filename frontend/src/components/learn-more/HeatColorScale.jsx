import React, { useState } from 'react';

export default function HeatColorScale({
  parameter = 'temperature',
  title = 'SEE THE HEAT',
  description = "Temperature data is mapped geographically onto the 3D Earth and represented through an interactive scientific color scale. Users can explore different regions and identify variations in temperature across the ocean.",
  unit = '°C',
  ranges = [
    { label: 'Abyssal Deep', val: '2–6 °C', color: '#1e3a8a', desc: 'Cold intermediate & bottom water masses' },
    { label: 'Subsurface Thermocline', val: '14–20 °C', color: '#06b6d4', desc: 'Rapid thermal decline layer' },
    { label: 'Somali Upwelling', val: '22–25 °C', color: '#10b981', desc: 'Nutrient-rich cold coastal tongue' },
    { label: 'Subtropical Gyre', val: '24–27 °C', color: '#eab308', desc: 'Southern Indian Ocean transition' },
    { label: 'Arabian Sea Warm Pool', val: '28–29.5 °C', color: '#f97316', desc: 'High salinity evaporative basin' },
    { label: 'Equatorial Warm Pool', val: '30–32 °C', color: '#ef4444', desc: 'Maximum sea surface temperature zone' },
  ]
}) {
  const [activeRange, setActiveRange] = useState(ranges[ranges.length - 1]);

  return (
    <section id="see-the-heat" className="w-full py-[50px] max-w-[1240px] mx-auto px-[24px] sm:px-[36px]">
      <div className="p-[32px] sm:p-[44px] rounded-[24px] border border-[rgba(98,217,255,0.2)] bg-[rgba(3,16,33,0.68)] backdrop-blur-[20px] shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
        {/* Section Header */}
        <div className="max-w-[800px] mb-[32px]">
          <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[2px] uppercase mb-[10px]">
            Thermal Radiance & Color Mapping
          </div>
          <h2 className="m-0 text-[28px] sm:text-[36px] font-bold text-white tracking-[-1px]">
            {title}
          </h2>
          <p className="mt-[16px] text-[rgba(215,235,248,0.78)] text-[15px] sm:text-[16px] leading-[1.8]">
            {description}
          </p>
        </div>

        {/* Continuous Scientific Colorbar */}
        <div className="p-[20px] rounded-[16px] border border-[rgba(120,190,220,0.16)] bg-[rgba(2,10,22,0.55)]">
          <div className="flex justify-between items-center text-[12px] font-mono text-[rgba(180,215,238,0.75)] mb-[10px]">
            <span>Low {unit}</span>
            <span className="font-semibold text-[#63d9ff]">Continuous Gradient Scale</span>
            <span>High {unit}</span>
          </div>

          {/* Color Gradient Strip */}
          <div
            className="h-[18px] w-full rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.4),0_0_15px_rgba(14,165,233,0.2)]"
            style={{
              background: parameter === 'temperature'
                ? 'linear-gradient(90deg, #1e3a8a 0%, #06b6d4 25%, #10b981 50%, #eab308 72%, #f97316 88%, #ef4444 100%)'
                : parameter === 'salinity'
                ? 'linear-gradient(90deg, #7e22ce 0%, #3b82f6 25%, #06b6d4 50%, #22c55e 75%, #eab308 100%)'
                : 'linear-gradient(90deg, #1e40af 0%, #0284c7 35%, #334155 50%, #d97706 68%, #dc2626 100%)'
            }}
          />

          {/* Scale Labels */}
          <div className="flex justify-between items-center text-[11px] font-mono text-[rgba(200,225,242,0.65)] mt-[8px]">
            {parameter === 'temperature' ? (
              <>
                <span>2°C</span>
                <span>12°C</span>
                <span>20°C</span>
                <span>26°C</span>
                <span>29°C</span>
                <span>32°C</span>
              </>
            ) : parameter === 'salinity' ? (
              <>
                <span>30.0 PSU</span>
                <span>32.0 PSU</span>
                <span>34.0 PSU</span>
                <span>35.5 PSU</span>
                <span>37.0 PSU</span>
              </>
            ) : (
              <>
                <span>-1.5 m/s</span>
                <span>-0.5 m/s</span>
                <span>0.0 m/s</span>
                <span>+0.5 m/s</span>
                <span>+1.5 m/s</span>
              </>
            )}
          </div>
        </div>

        {/* Region & Range Interactive Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[12px] mt-[24px]">
          {ranges.map((item, idx) => {
            const isSelected = activeRange.label === item.label;
            return (
              <button
                key={idx}
                onClick={() => setActiveRange(item)}
                className={`p-[14px] rounded-[14px] text-left transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'border-[#38bdf8] bg-[rgba(14,165,233,0.18)] shadow-[0_0_20px_rgba(56,189,248,0.25)] -translate-y-[2px]'
                    : 'border-[rgba(120,190,220,0.12)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                <div className="flex items-center gap-[8px] mb-[6px]">
                  <span
                    className="w-[10px] h-[10px] rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: item.color, color: item.color }}
                  />
                  <span className="text-[11px] font-bold text-white font-mono">{item.val}</span>
                </div>
                <div className="text-[12px] font-semibold text-[#f0f9ff] line-clamp-1">{item.label}</div>
              </button>
            );
          })}
        </div>

        {/* Detailed Range Spotlight Card */}
        {activeRange && (
          <div className="mt-[24px] p-[20px] rounded-[16px] border border-[rgba(56,189,248,0.25)] bg-[linear-gradient(135deg,rgba(14,165,233,0.1),rgba(3,16,33,0.7))] flex items-center justify-between flex-wrap gap-[16px]">
            <div className="flex items-center gap-[14px]">
              <div
                className="w-[18px] h-[18px] rounded-full shadow-[0_0_12px_currentColor]"
                style={{ backgroundColor: activeRange.color, color: activeRange.color }}
              />
              <div>
                <div className="text-[15px] font-bold text-white">
                  {activeRange.label} ({activeRange.val})
                </div>
                <div className="text-[13px] text-[rgba(215,235,248,0.72)] mt-[2px]">
                  {activeRange.desc}
                </div>
              </div>
            </div>
            <div className="text-[12px] text-[#63d9ff] font-mono font-medium">
              3D ISOSURFACE HIGHLIGHT
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
