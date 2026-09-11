import React from 'react';
import TemperatureFlowField from '../components/learn-more/TemperatureFlowField';
import GlobalSSTMap from '../components/learn-more/GlobalSSTMap';
import BottomWaveDecoration from '../components/learn-more/BottomWaveDecoration';
import DepthVisualization from '../components/learn-more/DepthVisualization';
import TimeTimeline from '../components/learn-more/TimeTimeline';
import SpaceDepthTime from '../components/learn-more/SpaceDepthTime';
import ModelObservation from '../components/learn-more/ModelObservation';
import WhyItMatters from '../components/learn-more/WhyItMatters';

export default function Temperature({ onNavigate }) {
  const scrollToExplore = () => {
    const el = document.getElementById('deep-dive-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onNavigate) {
      onNavigate('visualization');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full overflow-x-hidden overflow-y-auto text-white font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif] bg-[#020817] selection:bg-[#38bdf8]/30 selection:text-white">
      
      {/* =========================================================================
          HERO SECTION — Matches the Reference Screenshot
          Left: Typography & Controls (~38%)
          Right: Large Indian Ocean Thermal Map with Flowing Streamlines (~62%)
          ========================================================================= */}
      <section className="relative w-full max-w-[1580px] mx-auto px-6 sm:px-10 lg:px-12 pt-8 pb-4 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.55fr] gap-8 items-center min-h-[380px] lg:min-h-[430px]">
          
          {/* LEFT SIDE: Heading & Description */}
          <div className="relative z-10 flex flex-col justify-center max-w-[480px]">
            {/* Glowing Thermometer Icon in Circle */}
            <div className="w-[52px] h-[52px] rounded-full border border-[#f97316]/60 bg-[#f97316]/10 flex items-center justify-center shadow-[0_0_22px_rgba(249,115,22,0.4)] mb-4">
              <svg
                className="w-7 h-7 text-[#f97316]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                <path d="M12 9v5" strokeWidth="2.5" />
                <circle cx="12" cy="17" r="2" fill="currentColor" />
              </svg>
            </div>

            {/* Ocean Parameter Eyebrow */}
            <div className="text-[11px] font-semibold tracking-[2px] uppercase text-[#64748b] mb-1.5">
              OCEAN PARAMETER
            </div>

            {/* Main Heading */}
            <h1 className="m-0 text-[42px] sm:text-[48px] font-extrabold tracking-[-1.2px] text-white leading-[1.05]">
              Temperature
            </h1>

            {/* Subtitle */}
            <p className="mt-1.5 mb-3.5 text-[18px] sm:text-[20px] font-medium text-[#e2e8f0] tracking-[-0.2px]">
              The Heat Beneath the Waves
            </p>

            {/* Descriptive Body */}
            <p className="m-0 text-[13.5px] sm:text-[14px] leading-[1.65] text-[rgba(200,225,242,0.72)] font-normal">
              Ocean temperature is a measure of how warm or cold the water is, usually at the surface or at different depths. It plays a crucial role in regulating climate, marine life, and ocean circulation.
            </p>

            {/* Pill CTA Button */}
            <div className="mt-6">
              <button
                onClick={scrollToExplore}
                className="inline-flex items-center gap-2 border border-[#00b4d8] rounded-full px-5 py-2.5 bg-transparent hover:bg-[#00b4d8]/15 text-[#38bdf8] text-[13.5px] font-medium tracking-[0.2px] shadow-[0_0_18px_rgba(0,180,216,0.18)] transition-all duration-200 cursor-pointer hover:shadow-[0_0_24px_rgba(0,180,216,0.35)] hover:-translate-y-0.5"
              >
                <span>Explore Temperature Data</span>
                <span className="text-[15px]">→</span>
              </button>
            </div>
          </div>

          {/* RIGHT SIDE: Large Indian Ocean Thermal Map with Flowing Streamlines */}
          <div className="relative w-full h-[360px] sm:h-[400px] lg:h-[430px] flex items-center justify-end overflow-hidden">
            <TemperatureFlowField className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION: WHY IT MATTERS — 4-Column Dashboard Matching the Screenshot
          Col 1: 4 Informational Rows with Outlined Cyan Icons (~24%)
          Col 2: Global Sea Surface Temperature Card with Colormap (~38%)
          Col 3: How It's Used Checklist + Lightbulb Box (~22%)
          Col 4: Rightmost Vertical Quote Card (~16%)
          ========================================================================= */}
      <section className="relative w-full max-w-[1580px] mx-auto px-6 sm:px-10 lg:px-12 pt-4 pb-8">
        {/* Section Heading */}
        <h2 className="m-0 text-[24px] sm:text-[27px] font-bold text-white tracking-[-0.5px] mb-5">
          Why It Matters
        </h2>

        {/* 4-Part Dashboard Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.1fr_1.55fr_1.1fr_0.8fr] gap-5 items-stretch">
          
          {/* COLUMN 1: 4 Compact Rows with Outlined Circular Icons */}
          <div className="flex flex-col justify-between space-y-4 py-1">
            {/* 1. Climate Regulation */}
            <div className="flex items-center gap-3.5">
              <div className="w-[44px] h-[44px] rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/5 flex items-center justify-center text-[#38bdf8] shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z" />
                  <path d="M3 12h18" />
                </svg>
              </div>
              <div>
                <div className="text-[14px] font-bold text-white leading-snug">
                  Climate Regulation
                </div>
                <div className="text-[12px] text-[rgba(200,225,242,0.65)] leading-tight mt-0.5">
                  Influences weather patterns and long-term climate change.
                </div>
              </div>
            </div>

            {/* 2. Marine Life */}
            <div className="flex items-center gap-3.5">
              <div className="w-[44px] h-[44px] rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/5 flex items-center justify-center text-[#38bdf8] shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12c4-6 10-6 14 0-4 6-10 6-14 0z" />
                  <circle cx="15" cy="12" r="1" fill="currentColor" />
                  <path d="M6 12l-4 3v-6l4 3z" />
                </svg>
              </div>
              <div>
                <div className="text-[14px] font-bold text-white leading-snug">
                  Marine Life
                </div>
                <div className="text-[12px] text-[rgba(200,225,242,0.65)] leading-tight mt-0.5">
                  Affects the distribution, behavior and survival of ocean species.
                </div>
              </div>
            </div>

            {/* 3. Ocean Circulation */}
            <div className="flex items-center gap-3.5">
              <div className="w-[44px] h-[44px] rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/5 flex items-center justify-center text-[#38bdf8] shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 8c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0" />
                  <path d="M2 13c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0" />
                  <path d="M2 18c2.5-2 5-2 7.5 0s5 2 7.5 0 5-2 7 0" />
                </svg>
              </div>
              <div>
                <div className="text-[14px] font-bold text-white leading-snug">
                  Ocean Circulation
                </div>
                <div className="text-[12px] text-[rgba(200,225,242,0.65)] leading-tight mt-0.5">
                  Drives currents and heat transfer around the globe.
                </div>
              </div>
            </div>

            {/* 4. Ecosystems */}
            <div className="flex items-center gap-3.5">
              <div className="w-[44px] h-[44px] rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/5 flex items-center justify-center text-[#38bdf8] shrink-0 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21v-7" />
                  <path d="M8 21v-4c0-2 2-3 4-3s4 1 4 3v4" />
                  <path d="M5 21v-2c0-1.5 1.5-2.5 3-2.5" />
                  <path d="M19 21v-2c0-1.5-1.5-2.5-3-2.5" />
                  <circle cx="12" cy="7" r="3" />
                </svg>
              </div>
              <div>
                <div className="text-[14px] font-bold text-white leading-snug">
                  Ecosystems
                </div>
                <div className="text-[12px] text-[rgba(200,225,242,0.65)] leading-tight mt-0.5">
                  Impacts coral reefs, coastal regions and ecosystems.
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Global Sea Surface Temperature Card */}
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[#03152B]/60 backdrop-blur-[16px] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.4)] flex flex-col justify-between">
            <h3 className="m-0 text-[15px] font-bold text-white mb-3 tracking-[-0.2px]">
              Global Sea Surface Temperature
            </h3>
            <GlobalSSTMap />
          </div>

          {/* COLUMN 3: How It's Used Checklist + Highlight Box */}
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[#03152B]/60 backdrop-blur-[16px] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.4)] flex flex-col justify-between">
            <div>
              <h3 className="m-0 text-[15px] font-bold text-white mb-3.5 tracking-[-0.2px]">
                How It's Used
              </h3>

              <ul className="space-y-2.5 p-0 m-0 list-none">
                {[
                  "Weather and climate forecasting",
                  "Studying El Niño and La Niña",
                  "Monitoring coral reef health",
                  "Tracking ocean heat content",
                  "Supporting sustainable fisheries",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-[13px] text-[rgba(215,235,248,0.85)]">
                    <span className="text-[#22c55e] font-bold text-[14px]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Highlighted Insight Box */}
            <div className="mt-4 p-3 rounded-[12px] border border-[rgba(56,189,248,0.3)] bg-[rgba(6,25,48,0.65)] flex items-center gap-3">
              <div className="text-[#38bdf8] shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
                </svg>
              </div>
              <p className="m-0 text-[11.5px] leading-relaxed text-[rgba(215,235,248,0.88)]">
                Warmer ocean temperatures can lead to stronger storms, coral bleaching, and shifts in marine ecosystems.
              </p>
            </div>
          </div>

          {/* COLUMN 4: Rightmost Vertical Quote Card */}
          <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#03152B_0%,#020b18_100%)] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.4)] flex flex-col justify-between items-center text-center relative overflow-hidden">
            {/* Background subtle flowing curves */}
            <div className="absolute inset-0 pointer-events-none opacity-25">
              <svg className="w-full h-full" viewBox="0 0 200 300" fill="none" preserveAspectRatio="none">
                <path d="M-20 80 C60 120 140 40 220 100" stroke="#38bdf8" strokeWidth="1" />
                <path d="M-20 140 C80 180 120 100 220 160" stroke="#0ea5e9" strokeWidth="1.2" />
                <path d="M-20 200 C40 240 160 160 220 220" stroke="#6366f1" strokeWidth="1" />
              </svg>
            </div>

            {/* Center wave icon */}
            <div className="relative z-10 w-8 h-8 flex items-center justify-center text-[#38bdf8] mb-4">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12c3-3 6-3 9 0s6 3 9 0" />
                <path d="M2 17c3-3 6-3 9 0s6 3 9 0" />
              </svg>
            </div>

            {/* Quote text */}
            <p className="relative z-10 text-[13.5px] sm:text-[14px] leading-relaxed text-[rgba(225,240,250,0.9)] italic m-0">
              "The ocean's temperature isn't just a number — it's a signal of a changing planet."
            </p>

            {/* Bottom tag */}
            <div className="relative z-10 mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)] w-full">
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[rgba(180,210,230,0.55)]">
                HEALTHY OCEANS
              </div>
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[rgba(180,210,230,0.55)] mt-0.5">
                HEALTHY FUTURES
              </div>
            </div>
          </div>
        </div>

        {/* Bottom subtle wave decoration */}
        <BottomWaveDecoration className="mt-8" />
      </section>

      {/* =========================================================================
          EXTENDED SCIENTIFIC SECTIONS (Below-the-fold)
          Ensures all supplied content is thoroughly available for scroll exploration
          ========================================================================= */}
      <div id="deep-dive-section" className="relative border-t border-[rgba(255,255,255,0.06)] pt-6">
        {/* DIVE DEEPER */}
        <DepthVisualization
          parameter="temperature"
          title="DIVE DEEPER"
          description="Temperature is not the same at every depth. With depth-based navigation, users can select specific layers of the ocean and examine the corresponding temperature field. Vertical exaggeration further helps make changes beneath the surface visually distinguishable."
        />

        {/* WATCH IT CHANGE */}
        <TimeTimeline
          title="WATCH IT CHANGE"
          description="Ocean temperature can also be explored across different timestamps within the available model data. Moving through time allows users to observe how temperature patterns evolve."
        />

        {/* SPACE × DEPTH × TIME */}
        <SpaceDepthTime />

        {/* MODEL MEETS OBSERVATION */}
        <ModelObservation
          parameter="temperature"
          title="MODEL MEETS OBSERVATION"
          description="Temperature is also available through observational data from instruments such as Argo floats and gliders. These observations can be explored alongside model fields, providing a way to examine temperature profiles and compare modeled conditions with measurements."
        />

        {/* WHY TEMPERATURE MATTERS CLOSING */}
        <WhyItMatters
          parameter="temperature"
          title="WHY TEMPERATURE MATTERS"
          paragraphs={[
            "Temperature patterns can help reveal important characteristics of the ocean, including variations across regions and depths. Visualizing these patterns provides researchers, forecasters, and other users with a clearer way to understand ocean conditions.",
            "As the thermal engine of global climate, the Indian Ocean stores and redistributes vast quantities of heat that directly modulate the South Asian monsoon, tropical cyclone genesis, and biological productivity."
          ]}
          closingStatements={[
            "Explore the temperature.",
            "Trace its changes.",
            "See the ocean beneath the surface."
          ]}
          onExploreClick={() => onNavigate && onNavigate('visualization')}
        />
      </div>
    </div>
  );
}
