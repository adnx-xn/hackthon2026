import React from 'react';

export default function Home({ onNavigate }) {
  return (
    <div className="min-h-[calc(100vh-72px)] w-full relative overflow-x-hidden overflow-y-auto text-[#ffffff] font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif] bg-[radial-gradient(circle_at_50%_35%,rgba(8,76,120,0.32),transparent_45%),linear-gradient(135deg,#020817_0%,#031525_45%,#020611_100%)]">
      {/* Background glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[rgba(0,180,255,0.08)] blur-[90px] -top-[180px] -left-[120px] pointer-events-none" />

      <div className="absolute w-[450px] h-[450px] rounded-full bg-[rgba(0,90,255,0.08)] blur-[100px] -bottom-[180px] -right-[100px] pointer-events-none" />

      {/* Main content */}
      <main className="relative z-[2] max-w-[1200px] min-h-[calc(100vh-72px)] h-auto mx-auto py-[70px] px-[40px] flex flex-col justify-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-[10px] mb-[22px] text-[#62d9ff] text-[13px] font-semibold tracking-[2px] uppercase">
          <span className="w-[32px] h-[1px] bg-[#62d9ff] inline-block" />
          Ocean Data Visualization
        </div>

        {/* Hero heading */}
        <h1 className="m-0 max-w-[850px] text-[clamp(42px,6vw,76px)] leading-[1.02] font-bold tracking-[-2.5px]">
          Explore the
          <span className="block bg-[linear-gradient(90deg,#ffffff_0%,#65d9ff_55%,#3b82f6_100%)] bg-clip-text text-transparent">
            Oceanis 3D
          </span>
        </h1>

        {/* Description */}
        <p className="max-w-[680px] mt-[28px] mb-0 text-[rgba(220,235,245,0.72)] text-[17px] leading-[1.8]">
          Explore oceanographic model data through an interactive three-
          dimensional environment. Visualize ocean temperature, salinity,
          currents and other scientific variables across space, depth and
          time.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap gap-[14px] mt-[36px]">
          <button
            onClick={() => onNavigate?.("visualization")}
            className="border-none rounded-[10px] py-[14px] px-[24px] bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-[#ffffff] text-[14px] font-semibold cursor-pointer shadow-[0_10px_30px_rgba(14,165,233,0.22)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[2px] hover:shadow-[0_14px_35px_rgba(14,165,233,0.35)]"
          >
            Explore Visualization →
          </button>

          <button
            onClick={() => onNavigate?.("about")}
            className="border border-[rgba(148,190,215,0.22)] rounded-[10px] py-[14px] px-[24px] bg-[rgba(255,255,255,0.035)] text-[#dbeafe] text-[14px] font-medium cursor-pointer backdrop-blur-[12px] transition-[background,border-color] duration-200 ease-out hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(98,217,255,0.35)]"
          >
            Learn More
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[14px] mt-[65px] max-w-[900px]">
          {[
            {
              icon: "◉",
              title: "3D Ocean",
              text: "Explore ocean data on an interactive globe.",
            },
            {
              icon: "≈",
              title: "Ocean Variables",
              text: "Visualize temperature, salinity and currents.",
            },
            {
              icon: "◷",
              title: "Time & Depth",
              text: "Navigate through different temporal and depth layers.",
            },
            {
              icon: "◇",
              title: "Scientific Data",
              text: "Work directly with oceanographic model datasets.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-[20px] rounded-[12px] border border-[rgba(148,190,215,0.12)] bg-[rgba(255,255,255,0.035)] backdrop-blur-[14px]"
            >
              <div className="text-[#5edbff] text-[20px] mb-[12px]">
                {item.icon}
              </div>

              <h3 className="m-0 text-[15px] font-semibold text-[#eef9ff]">
                {item.title}
              </h3>

              <p className="m-[8px_0_0] text-[rgba(210,225,235,0.58)] text-[12px] leading-[1.6]">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        {/* Footer identity */}
        <div className="mt-[45px] text-[rgba(190,215,230,0.4)] text-[11px] tracking-[0.5px]">
          INCOIS · 3D Ocean Data Visualization System
        </div>
      </main>
    </div>
  );
}

