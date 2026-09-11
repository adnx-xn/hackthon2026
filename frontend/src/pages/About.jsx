import React, { useRef, useEffect } from 'react';
import AboutOceanBackground from './AboutOceanBackground';

export default function About({ onNavigate }) {
  const scrollContainerRef = useRef(null);
  const scrollProgressRef = useRef(0);

  // Track scroll progress across scrollable container and window
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;

      if (container && container.scrollHeight > container.clientHeight) {
        scrollTop = container.scrollTop;
        scrollHeight = container.scrollHeight;
        clientHeight = container.clientHeight;
      } else {
        scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        scrollHeight = document.documentElement.scrollHeight || 1;
        clientHeight = window.innerHeight || 1;
      }

      const maxScroll = Math.max(scrollHeight - clientHeight, 1);
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      scrollProgressRef.current = progress;
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const exploreParameters = [
    {
      route: 'learn-more/temperature',
      title: 'Ocean Temperature',
      param: 'thetao (°C)',
      icon: '🌡️',
      desc: 'Explore thermal stratification, the tropical warm pool, and upwelling wedges.',
      color: '#ef4444',
    },
    {
      route: 'learn-more/salinity',
      title: 'Ocean Salinity',
      param: 'so (PSU)',
      icon: '🧂',
      desc: 'Map the salinity disparity between the Arabian Sea and Bay of Bengal.',
      color: '#06b6d4',
    },
    {
      route: 'learn-more/vo',
      title: 'Northward Velocity',
      param: 'vo (m/s)',
      icon: '🧭',
      desc: 'Trace meridional flow, the Somali Current surge, and cross-equatorial mass transport.',
      color: '#f97316',
    },
    {
      route: 'learn-more/uo',
      title: 'Eastward Velocity',
      param: 'uo (m/s)',
      icon: '↔️',
      desc: 'Witness the semi-annual Wyrtki Jet pulsing across the Indian Ocean equator.',
      color: '#38bdf8',
    },
  ];

  return (
    <div
      ref={scrollContainerRef}
      className="relative min-h-[calc(100vh-68px)] h-[calc(100vh-68px)] w-full overflow-x-hidden overflow-y-auto text-[#ffffff] font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif] bg-gradient-to-b from-[#020713]/40 via-[#031122]/30 to-[#020b18]/45 selection:bg-[#38bdf8]/30 selection:text-white"
    >
      {/* 3D Cinematic Background Visualization (SPACE -> EARTH -> INDIAN OCEAN -> LIQUID TRANSFORMATION -> OCEAN -> WAVES) */}
      <AboutOceanBackground scrollProgressRef={scrollProgressRef} />

      {/* Atmospheric lighting glows */}
      <div className="fixed w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(0,180,255,0.08)_0%,transparent_70%)] blur-[120px] -top-[200px] -right-[120px] pointer-events-none z-[1]" />
      <div className="fixed w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(14,116,144,0.07)_0%,transparent_70%)] blur-[110px] bottom-[10%] -left-[100px] pointer-events-none z-[1]" />

      {/* Main Foreground Content */}
      <main className="relative z-[2] max-w-[1140px] mx-auto pt-[60px] px-[28px] sm:px-[40px] pb-[100px]">
        
        {/* 1. HERO SECTION: Understanding the Ocean, One Layer at a Time */}
        <section className="max-w-[880px]">
          <div className="inline-flex items-center gap-[10px] text-[#62d9ff] text-[12px] font-semibold tracking-[2px] uppercase mb-[20px] px-[14px] py-[6px] rounded-full bg-[rgba(14,165,233,0.08)] border border-[rgba(98,217,255,0.22)] backdrop-blur-[8px]">
            <span className="w-[18px] h-[1.5px] bg-[#62d9ff]" />
            About OceanSight · Oceanis 3D
          </div>

          <h1 className="m-0 text-[clamp(38px,5.8vw,66px)] leading-[1.06] tracking-[-2px] font-bold">
            Understanding the Ocean,
            <span className="block mt-[6px] bg-[linear-gradient(90deg,#ffffff_0%,#63d9ff_50%,#38bdf8_100%)] bg-clip-text text-transparent">
              One Layer at a Time.
            </span>
          </h1>

          <div className="mt-[26px] p-[28px] rounded-[18px] border border-[rgba(120,190,220,0.18)] bg-[rgba(3,16,33,0.64)] backdrop-blur-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
            <p className="m-0 text-[rgba(225,240,250,0.88)] text-[16px] sm:text-[17px] leading-[1.8] font-normal">
              Oceanis 3D (OceanSight) is an interactive scientific ocean data visualization platform developed for INCOIS to transform complex oceanographic datasets into an intuitive, high-performance three-dimensional environment.
            </p>
            <p className="mt-[16px] mb-0 text-[rgba(200,225,242,0.75)] text-[15px] sm:text-[16px] leading-[1.8]">
              By bringing together numerical ocean model outputs and in-situ observational profilers across the Indian Ocean basin, the platform enables researchers, forecasters, and students to navigate ocean conditions across space, depth, and time.
            </p>
          </div>
        </section>

        {/* 2. SECTION: WHAT WE DO */}
        <section className="mt-[60px] grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-[24px]">
          <div className="p-[32px] rounded-[20px] border border-[rgba(120,190,220,0.18)] bg-[rgba(3,16,33,0.64)] backdrop-blur-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.35)] flex flex-col justify-center">
            <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[1.5px] uppercase mb-[10px]">
              Multi-Layered Environment
            </div>

            <h2 className="m-[0_0_16px] text-[24px] sm:text-[28px] font-semibold tracking-[-0.5px] text-[#f0f9ff]">
              WHAT WE DO: Connecting Data with the Ocean
            </h2>

            <p className="m-0 text-[rgba(215,235,248,0.78)] text-[14.5px] sm:text-[15px] leading-[1.8]">
              Understanding the ocean requires more than a single measurement or static map. Oceanis brings different layers of ocean information into one unified interactive environment—helping users examine temperature, salinity, currents, and observational profiles in their true geographic and temporal context.
            </p>

            <p className="mt-[14px] mb-0 text-[rgba(200,225,242,0.68)] text-[14px] leading-[1.8]">
              By combining high-resolution scientific data processing with modern WebGL visualization, the platform provides a clearer way to explore how the ocean changes beneath the surface.
            </p>
          </div>

          {/* Scientific stack card */}
          <div className="p-[32px] rounded-[20px] border border-[rgba(120,190,220,0.18)] bg-[linear-gradient(145deg,rgba(14,165,233,0.12),rgba(3,16,33,0.7))] backdrop-blur-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.35)] flex flex-col justify-center">
            <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[1.5px] uppercase mb-[16px]">
              Core Scientific Stack
            </div>

            {[
              { name: "3D Globe & Space System", desc: "True spherical georeferenced coordinates" },
              { name: "Ocean Model Data", desc: "FastAPI + xarray scientific processing" },
              { name: "In-Situ Observational Markers", desc: "Argo floats and glider depth profiles" },
              { name: "Temporal Sequence Animation", desc: "Monitored non-overlapping animation loop" },
            ].map((item) => (
              <div
                key={item.name}
                className="py-[12px] border-b border-[rgba(255,255,255,0.07)] last:border-b-0"
              >
                <div className="flex items-center gap-[10px] text-[rgba(235,245,252,0.9)] text-[13.5px] font-medium">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#50d9ff] shadow-[0_0_10px_rgba(80,217,255,0.8)]" />
                  {item.name}
                </div>
                <div className="text-[rgba(180,210,230,0.52)] text-[11.5px] mt-[3px] ml-[16px]">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. SECTION: WHY IT MATTERS */}
        <section className="mt-[65px] p-[34px] rounded-[20px] border border-[rgba(98,217,255,0.2)] bg-[rgba(3,16,33,0.64)] backdrop-blur-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
          <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[1.5px] uppercase mb-[10px]">
            The Significance of Ocean Intelligence
          </div>

          <h2 className="m-[0_0_16px] text-[25px] sm:text-[28px] font-semibold tracking-[-0.5px]">
            WHY IT MATTERS: The Living Indian Ocean
          </h2>

          <p className="m-0 max-w-[900px] text-[rgba(215,235,248,0.8)] text-[14.5px] sm:text-[15.5px] leading-[1.8]">
            Ocean observations and numerical models play a crucial role in understanding the Indian Ocean and its changing climate. The Indian Ocean modulates the South Asian monsoon, regulates cyclonic intensification, and drives global marine heat redistribution.
          </p>

          <p className="mt-[12px] m-0 max-w-[900px] text-[rgba(200,225,242,0.7)] text-[14px] leading-[1.8]">
            OceanSight builds on this scientific data ecosystem by providing an interactive visual layer where complex multi-dimensional datasets can be explored more intuitively.
          </p>

          <div className="mt-[24px] p-[20px] rounded-[14px] border border-[rgba(56,189,248,0.25)] bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(37,99,235,0.06))] backdrop-blur-[12px]">
            <h3 className="m-0 text-[#63d9ff] text-[13px] font-bold tracking-[1.2px] uppercase">
              Our aim is simple:
            </h3>
            <p className="m-[6px_0_0] text-[#f0f9ff] text-[16px] sm:text-[17px] font-medium leading-[1.6]">
              Make complex oceanographic data easier to see, explore, and understand.
            </p>
          </div>
        </section>

        {/* 4. SECTION: WHAT YOU CAN EXPLORE */}
        <section className="mt-[65px]">
          <div className="max-w-[800px] mb-[24px]">
            <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[1.5px] uppercase mb-[10px]">
              Scientific Ocean Parameters
            </div>
            <h2 className="m-0 text-[26px] sm:text-[32px] font-semibold tracking-[-0.5px]">
              WHAT YOU CAN EXPLORE
            </h2>
            <p className="mt-[12px] text-[rgba(215,235,248,0.75)] text-[15px] leading-[1.7]">
              Dive into dedicated deep-dives on every fundamental variable governing the marine system:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
            {exploreParameters.map((item) => (
              <div
                key={item.title}
                onClick={() => onNavigate && onNavigate(item.route)}
                className="p-[26px] rounded-[18px] border border-[rgba(120,190,220,0.18)] bg-[rgba(3,16,33,0.64)] backdrop-blur-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer hover:-translate-y-[4px] hover:border-[#38bdf8] hover:bg-[rgba(5,24,48,0.75)] flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-[16px]">
                    <span className="text-[26px]">{item.icon}</span>
                    <span className="px-[8px] py-[3px] rounded bg-[rgba(255,255,255,0.06)] text-[#63d9ff] font-mono text-[11px]">
                      {item.param}
                    </span>
                  </div>

                  <h3 className="m-0 text-[18px] font-bold text-white group-hover:text-[#63d9ff] transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-[10px] mb-0 text-[rgba(205,225,238,0.65)] text-[13px] leading-[1.7]">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-[20px] pt-[12px] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[12px] text-[#38bdf8] font-medium">
                  <span>Learn More</span>
                  <span className="group-hover:translate-x-[4px] transition-transform">→</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. SECTION: OUR APPROACH */}
        <section className="mt-[65px] p-[34px] rounded-[20px] border border-[rgba(120,190,220,0.18)] bg-[rgba(3,16,33,0.64)] backdrop-blur-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
          <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[1.5px] uppercase mb-[10px]">
            Engineering Philosophy
          </div>

          <h2 className="m-[0_0_16px] text-[25px] sm:text-[28px] font-semibold tracking-[-0.5px]">
            OUR APPROACH: Built for Scientific Precision
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px] mt-[20px]">
            <div className="p-[20px] rounded-[14px] bg-[rgba(2,10,22,0.6)] border border-[rgba(255,255,255,0.06)]">
              <div className="text-[#38bdf8] font-bold text-[15px] mb-[8px]">True 3D Representation</div>
              <p className="m-0 text-[rgba(205,225,238,0.68)] text-[13px] leading-[1.7]">
                Not a flat 2D map. Rendered as 3D meshes on a spherical Earth globe with genuine depth coordinates and calibrated vertical exaggeration.
              </p>
            </div>

            <div className="p-[20px] rounded-[14px] bg-[rgba(2,10,22,0.6)] border border-[rgba(255,255,255,0.06)]">
              <div className="text-[#38bdf8] font-bold text-[15px] mb-[8px]">Scientific Normalization</div>
              <p className="m-0 text-[rgba(205,225,238,0.68)] text-[13px] leading-[1.7]">
                Strict data normalization preserving raw NetCDF values without lossy blurring or arbitrary modifications, verified against in-situ instruments.
              </p>
            </div>

            <div className="p-[20px] rounded-[14px] bg-[rgba(2,10,22,0.6)] border border-[rgba(255,255,255,0.06)]">
              <div className="text-[#38bdf8] font-bold text-[15px] mb-[8px]">Seamless Performance</div>
              <p className="m-0 text-[rgba(205,225,238,0.68)] text-[13px] leading-[1.7]">
                Optimized BufferGeometry, capped device pixel ratio, and GPU-friendly shader loops running smoothly across student laptops.
              </p>
            </div>
          </div>
        </section>

        {/* 6. SECTION: TEAM & PROJECT INFORMATION */}
        <section className="mt-[65px] p-[34px] rounded-[20px] border border-[rgba(98,217,255,0.22)] bg-[linear-gradient(135deg,rgba(8,70,105,0.28),rgba(3,16,33,0.7))] backdrop-blur-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-[16px] mb-[18px]">
            <div className="w-[46px] h-[46px] rounded-[12px] flex items-center justify-center bg-[rgba(56,189,248,0.14)] border border-[rgba(56,189,248,0.28)] text-[#63d9ff] font-bold text-[15px] shadow-[0_0_20px_rgba(56,189,248,0.2)]">
              IN
            </div>

            <div>
              <h2 className="m-0 text-[22px] font-semibold text-[#f0f9ff]">
                INCOIS · Ministry of Earth Sciences
              </h2>
              <span className="text-[rgba(195,225,242,0.65)] text-[12px]">
                Indian National Centre for Ocean Information Services · Government of India
              </span>
            </div>
          </div>

          <p className="m-0 max-w-[900px] text-[rgba(215,235,248,0.75)] text-[14px] leading-[1.8]">
            Developed under the Smart India Hackathon (SIH 2026) initiative. INCOIS is an autonomous institution mandated to provide ocean information, advisories, and warning services to society, industry, government agencies, and the scientific community through sustained observations and modelling.
          </p>

          <div className="mt-[28px] pt-[20px] border-t border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-[16px]">
            <div className="text-[12px] text-[rgba(180,210,230,0.6)] font-mono">
              SIH 2026 · Module: Learn More & About (Shaizee)
            </div>
            
            <button
              onClick={() => onNavigate && onNavigate('visualization')}
              className="inline-flex items-center gap-[8px] px-[20px] py-[10px] rounded-[10px] bg-[rgba(14,165,233,0.2)] border border-[rgba(98,217,255,0.3)] text-[#38bdf8] text-[13px] font-semibold hover:bg-[rgba(14,165,233,0.35)] transition-all cursor-pointer"
            >
              <span>Explore 3D Visualization →</span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-[60px] pt-[24px] border-t border-[rgba(255,255,255,0.08)] text-[rgba(190,215,230,0.45)] text-[12px] text-center tracking-[0.4px]">
          INCOIS · 3D Ocean Data Visualization System
        </div>
      </main>
    </div>
  );
}
