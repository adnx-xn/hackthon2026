import React from 'react';
import CurrentFlowCanvas from './CurrentFlowCanvas';

export default function ParameterHero({
  parameter = 'temperature',
  badgeText = 'OCEAN PARAMETER',
  title = 'TEMPERATURE',
  subtitle = 'Reading the Ocean Through Heat',
  description = [],
  ctaText = 'SEE THE HEAT',
  onCtaClick,
  icon = '🌡️',
}) {
  const handleCta = () => {
    if (onCtaClick) {
      onCtaClick();
    } else {
      const el = document.getElementById('see-the-heat');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative w-full pt-[40px] pb-[60px] max-w-[1240px] mx-auto px-[24px] sm:px-[36px]">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.25fr] gap-[36px] lg:gap-[48px] items-center">
        {/* LEFT COLUMN: Scientific Parameter Narrative */}
        <div className="flex flex-col justify-center max-w-[580px]">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-[10px] w-fit px-[14px] py-[6px] rounded-full bg-[rgba(14,165,233,0.08)] border border-[rgba(98,217,255,0.22)] backdrop-blur-[10px] text-[#63d9ff] text-[12px] font-semibold tracking-[2px] uppercase mb-[22px]">
            <span className="text-[14px]">{icon}</span>
            <span>{badgeText}</span>
          </div>

          {/* Main Title */}
          <h1 className="m-0 text-[clamp(44px,6vw,72px)] leading-[1.02] tracking-[-2px] font-bold text-white">
            {title}
          </h1>

          {/* Subtitle */}
          <p className="mt-[14px] mb-[24px] text-[clamp(20px,2.5vw,26px)] leading-[1.25] font-semibold bg-[linear-gradient(90deg,#ffffff_0%,#63d9ff_60%,#38bdf8_100%)] bg-clip-text text-transparent">
            {subtitle}
          </p>

          {/* Descriptive Content */}
          <div className="space-y-[16px] text-[rgba(215,235,248,0.8)] text-[15px] sm:text-[16px] leading-[1.8] font-normal">
            {description.map((paragraph, idx) => (
              <p key={idx} className="m-0">
                {paragraph}
              </p>
            ))}
          </div>

          {/* CTA Action */}
          <div className="mt-[36px] flex flex-wrap items-center gap-[16px]">
            <button
              onClick={handleCta}
              className="inline-flex items-center gap-[10px] px-[28px] py-[15px] rounded-[12px] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white text-[14px] font-semibold tracking-[1px] uppercase cursor-pointer border-none shadow-[0_10px_30px_rgba(14,165,233,0.35)] transition-[transform,box-shadow] duration-200 hover:-translate-y-[2px] hover:shadow-[0_14px_40px_rgba(14,165,233,0.5)] active:translate-y-0"
            >
              <span>{ctaText}</span>
              <span className="text-[16px] leading-none">↓</span>
            </button>

            <span className="text-[12px] text-[rgba(180,210,230,0.55)] tracking-[0.5px]">
              Scientific Data Layer · INCOIS 3D
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Cinematic 3D Indian Ocean Map & Streamlines */}
        <div className="relative w-full flex justify-center items-center">
          {/* Ambient decorative glow behind the map */}
          <div className="absolute w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.14)_0%,transparent_70%)] blur-[90px] pointer-events-none -z-10" />
          <div className="absolute -bottom-[20px] -right-[20px] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.08)_0%,transparent_70%)] blur-[80px] pointer-events-none -z-10" />

          {/* 3D Perspective container */}
          <div className="w-full transition-transform duration-300 ease-out hover:scale-[1.01]">
            <CurrentFlowCanvas parameter={parameter} />
          </div>
        </div>
      </div>
    </section>
  );
}
