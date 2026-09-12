import React from 'react';

export default function About() {
  const features = [
    {
      icon: "◉",
      title: "Ocean Observation",
      text: "Explore oceanographic information collected through observation systems and scientific datasets.",
    },
    {
      icon: "◇",
      title: "Ocean Modelling",
      text: "Visualize model-derived ocean variables across geographic regions, depth levels and time.",
    },
    {
      icon: "≈",
      title: "Scientific Visualization",
      text: "Transform complex ocean data into an interactive three-dimensional environment.",
    },
    {
      icon: "◷",
      title: "Time & Depth",
      text: "Navigate through available temporal and depth dimensions to examine changing ocean conditions.",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-72px)] w-full overflow-x-hidden overflow-y-auto text-[#ffffff] font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif] bg-[radial-gradient(circle_at_15%_20%,rgba(0,150,220,0.12),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(30,80,180,0.12),transparent_35%),linear-gradient(135deg,#020817_0%,#031525_50%,#020611_100%)] pt-[68px]">
      {/* Background glow */}
      <div className="fixed w-[500px] h-[500px] rounded-full bg-[rgba(0,180,255,0.07)] blur-[110px] -top-[180px] -right-[100px] pointer-events-none" />

      <main className="relative z-[2] max-w-[1100px] mx-auto pt-[70px] px-[40px] pb-[90px]">
        {/* Header */}
        <section className="max-w-[800px]">
          <div className="flex items-center gap-[10px] text-[#62d9ff] text-[12px] font-semibold tracking-[2px] uppercase mb-[20px]">
            <span className="w-[32px] h-[1px] bg-[#62d9ff]" />
            About the Project
          </div>

          <h1 className="m-0 text-[clamp(40px,6vw,68px)] leading-[1.05] tracking-[-2px] font-bold">
            Understanding the
            <span className="block bg-[linear-gradient(90deg,#ffffff,#63d9ff,#3b82f6)] bg-clip-text text-transparent">
              Ocean in 3D.
            </span>
          </h1>

          <p className="mt-[28px] text-[rgba(220,235,245,0.7)] text-[16px] leading-[1.8] max-w-[720px]">
            The INCOIS 3D Ocean Data Visualization System is an interactive
            scientific platform designed to make complex ocean model and
            observation data easier to explore and understand.
          </p>
        </section>

        {/* Project description */}
        <section className="mt-[65px] grid grid-cols-[1.2fr_0.8fr] gap-[20px]">
          <div className="p-[30px] rounded-[16px] border border-[rgba(120,190,220,0.15)] bg-[rgba(255,255,255,0.035)] backdrop-blur-[16px]">
            <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[1.5px] uppercase mb-[14px]">
              The Platform
            </div>

            <h2 className="m-[0_0_16px] text-[25px] font-semibold">
              From ocean data to an interactive world
            </h2>

            <p className="m-0 text-[rgba(215,230,240,0.65)] text-[14px] leading-[1.8]">
              The platform provides a true 3D environment for exploring
              oceanographic datasets. Users can examine variables such as
              temperature, salinity and ocean currents while navigating across
              geographic locations and available depth and time dimensions.
            </p>
          </div>

          {/* Scientific stack */}
          <div className="p-[30px] rounded-[16px] border border-[rgba(120,190,220,0.15)] bg-[linear-gradient(145deg,rgba(14,165,233,0.08),rgba(255,255,255,0.025))] backdrop-blur-[16px]">
            <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[1.5px] uppercase mb-[18px]">
              Visualization
            </div>

            {["3D Globe", "Ocean Model Data", "Depth Profiles", "Temporal Data"].map(
              (item) => (
                <div
                  key={item}
                  className="flex items-center gap-[10px] py-[11px] border-b border-[rgba(255,255,255,0.06)] text-[rgba(225,240,248,0.72)] text-[13px]"
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-[#50d9ff] shadow-[0_0_10px_rgba(80,217,255,0.6)]" />
                  {item}
                </div>
              )
            )}
          </div>
        </section>

        {/* Features */}
        <section className="mt-[70px]">
          <div className="text-[#63d9ff] text-[12px] font-semibold tracking-[1.5px] uppercase mb-[12px]">
            Core Capabilities
          </div>

          <h2 className="m-[0_0_25px] text-[28px] font-semibold">
            Built for scientific exploration
          </h2>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[14px]">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-[24px] rounded-[14px] border border-[rgba(120,190,220,0.12)] bg-[rgba(255,255,255,0.03)] transition-[transform,background] duration-200 ease-out hover:-translate-y-[3px] hover:bg-[rgba(255,255,255,0.055)]"
              >
                <div className="w-[38px] h-[38px] flex items-center justify-center rounded-[10px] bg-[rgba(56,189,248,0.1)] text-[#62d9ff] text-[19px] mb-[18px]">
                  {feature.icon}
                </div>

                <h3 className="m-[0_0_9px] text-[15px] font-semibold">
                  {feature.title}
                </h3>

                <p className="m-0 text-[rgba(210,225,235,0.58)] text-[12px] leading-[1.7]">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* INCOIS section */}
        <section className="mt-[70px] p-[32px] rounded-[16px] border border-[rgba(98,217,255,0.14)] bg-[linear-gradient(135deg,rgba(8,70,105,0.18),rgba(255,255,255,0.025))]">
          <div className="flex items-center gap-[14px] mb-[16px]">
            <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center bg-[rgba(56,189,248,0.1)] text-[#63d9ff] font-bold text-[13px]">
              IN
            </div>

            <div>
              <h2 className="m-0 text-[20px] font-semibold">
                INCOIS
              </h2>

              <span className="text-[rgba(200,220,235,0.5)] text-[11px]">
                Indian National Centre for Ocean Information Services
              </span>
            </div>
          </div>

          <p className="m-0 max-w-[850px] text-[rgba(215,230,240,0.62)] text-[13px] leading-[1.8]">
            INCOIS is an autonomous institution under the Ministry of Earth
            Sciences, Government of India. Its mission includes providing
            ocean data, information and advisory services through sustained
            ocean observations, research, information management and ocean
            modelling.
          </p>
        </section>

        {/* Footer */}
        <div className="mt-[55px] pt-[20px] border-t border-[rgba(255,255,255,0.07)] text-[rgba(190,215,230,0.38)] text-[11px] text-center">
          INCOIS · 3D Ocean Data Visualization System
        </div>
      </main>
    </div>
  );
}

