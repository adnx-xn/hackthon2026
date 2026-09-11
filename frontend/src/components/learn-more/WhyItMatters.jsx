import React from 'react';

export default function WhyItMatters({
  parameter = 'temperature',
  title = 'WHY TEMPERATURE MATTERS',
  paragraphs = [
    "Temperature patterns can help reveal important characteristics of the ocean, including variations across regions and depths. Visualizing these patterns provides researchers, forecasters, and other users with a clearer way to understand ocean conditions.",
    "From driving the monsoon cycles that support billions across South Asia to regulating global heat transport and supporting diverse marine ecosystems, thermal stratification governs the life of the Indian Ocean."
  ],
  closingStatements = [
    "Explore the temperature.",
    "Trace its changes.",
    "See the ocean beneath the surface."
  ],
  onExploreClick
}) {
  return (
    <section className="w-full py-[60px] pb-[90px] max-w-[1240px] mx-auto px-[24px] sm:px-[36px]">
      <div className="relative p-[36px] sm:p-[56px] rounded-[28px] border border-[rgba(98,217,255,0.28)] bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.18),rgba(2,8,22,0.88))] backdrop-blur-[24px] shadow-[0_25px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(14,165,233,0.15)] overflow-hidden">
        {/* Subtle background ambient rays */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.12)_0%,transparent_70%)] blur-[90px] pointer-events-none" />

        <div className="max-w-[850px]">
          <div className="inline-flex items-center gap-[10px] text-[#63d9ff] text-[12px] font-semibold tracking-[2px] uppercase mb-[16px]">
            <span className="w-[24px] h-[1.5px] bg-[#63d9ff]" />
            Oceanographic Significance
          </div>

          <h2 className="m-0 text-[32px] sm:text-[46px] font-extrabold text-white tracking-[-1.5px] leading-[1.1]">
            {title}
          </h2>

          <div className="mt-[24px] space-y-[16px] text-[rgba(215,235,248,0.82)] text-[16px] sm:text-[17px] leading-[1.8]">
            {paragraphs.map((para, idx) => (
              <p key={idx} className="m-0">
                {para}
              </p>
            ))}
          </div>

          {/* Powerful Closing Lines */}
          <div className="mt-[36px] p-[24px] rounded-[18px] border border-[rgba(56,189,248,0.3)] bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(3,16,33,0.6))] backdrop-blur-[14px]">
            <div className="space-y-[6px]">
              {closingStatements.map((line, idx) => (
                <div
                  key={idx}
                  className="text-[20px] sm:text-[24px] font-bold bg-[linear-gradient(90deg,#ffffff_0%,#7dd3fc_60%,#38bdf8_100%)] bg-clip-text text-transparent tracking-[-0.5px]"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Action to Launch 3D Visualization */}
          {onExploreClick && (
            <div className="mt-[36px]">
              <button
                onClick={onExploreClick}
                className="inline-flex items-center gap-[12px] px-[32px] py-[16px] rounded-[14px] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white text-[15px] font-bold tracking-[1px] uppercase cursor-pointer border-none shadow-[0_12px_35px_rgba(14,165,233,0.4)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[2px] hover:shadow-[0_16px_45px_rgba(14,165,233,0.55)]"
              >
                <span>Launch Interactive 3D Visualization →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
