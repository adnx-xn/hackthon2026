import React, { useEffect, useRef } from 'react';



export default function Home({ onNavigate }) {

 const videoRef = useRef(null);

   useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);

  return (
<div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto text-[#ffffff] font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif] pt-[68px]  ">
      {/* BACKGROUND VIDEO */}
      <video
  ref={videoRef}
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
  className="fixed inset-0 h-full w-full object-cover"
>
  <source
    src="/videos/ocean-background.mp4"
    type="video/mp4"
  />
</video>

      {/* VIDEO OVERLAY */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(2,8,23,0.88)_0%,rgba(2,8,23,0.62)_10%,rgba(2,8,23,0.38)_25%)]" />

      {/* LOWER DARK OVERLAY */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,0.25)_0%,rgba(2,8,23,0.35)_55%,rgba(2,8,23,0.92)_100%)]" />

      {/* Existing background glow */}
      <div className="pointer-events-none fixed -top-[180px] -left-[120px] h-[500px] w-[500px] rounded-full bg-[rgba(0,180,255,0.08)] blur-[90px]" />

      <div className="pointer-events-none fixed -right-[100px] -bottom-[180px] h-[450px] w-[450px] rounded-full bg-[rgba(0,90,255,0.08)] blur-[100px]" />

      {/* MAIN CONTENT */}
      <main className="relative z-[2] mx-auto flex min-h-[calc(100vh-72px)] max-w-[1200px] flex-col justify-center px-[40px] py-[70px]">

        {/* Eyebrow */}
        <div className="mb-[22px] inline-flex items-center gap-[10px] text-[13px] font-semibold uppercase tracking-[2px] text-[#62d9ff]">
          <span className="inline-block h-[1px] w-[32px] bg-[#62d9ff]" />
          Ocean Data Visualization
        </div>

        {/* Hero heading */}
        <h1 className="m-0 max-w-[850px] text-[clamp(42px,6vw,76px)] font-bold leading-[1.02] tracking-[-2.5px]">
          Explore the
          <span className="block bg-[linear-gradient(90deg,#ffffff_0%,#65d9ff_55%,#3b82f6_100%)] bg-clip-text text-transparent">
            Oceanis 3D
          </span>
        </h1>

        {/* Description */}
        <p className="mt-[28px] mb-0 max-w-[680px] text-[17px] leading-[1.8] text-[rgba(220,235,245,0.78)]">
          Explore oceanographic model data through an interactive three-
          dimensional environment. Visualize ocean temperature, salinity,
          currents and other scientific variables across space, depth and
          time.
        </p>

        {/* Buttons */}
        <div className="mt-[36px] flex flex-wrap gap-[14px]">
          <button
            onClick={() => onNavigate?.("visualization")}
            className="cursor-pointer rounded-[10px] border-none bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] py-[14px] px-[24px] text-[14px] font-semibold text-[#ffffff] shadow-[0_10px_30px_rgba(14,165,233,0.22)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[2px] hover:shadow-[0_14px_35px_rgba(14,165,233,0.35)]"
          >
            Explore Visualization →
          </button>

          <button
            onClick={() => onNavigate?.("about")}
            className="cursor-pointer rounded-[10px] border border-[rgba(148,190,215,0.22)] bg-[rgba(255,255,255,0.06)] py-[14px] px-[24px] text-[14px] font-medium text-[#dbeafe] backdrop-blur-[12px] transition-[background,border-color] duration-200 ease-out hover:border-[rgba(98,217,255,0.35)] hover:bg-[rgba(255,255,255,0.1)]"
          >
            Learn More
          </button>
        </div>

        {/* Feature cards */}
<div className="mt-[65px] grid max-w-[900px] grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-[14px]">
  {[
    {
      id: "visualization",
      icon: "◉",
      title: "3D Ocean",
      text: "Explore ocean data on an interactive globe.",
    },
    {
      id: "visualization",
      icon: "≈",
      title: "Ocean Variables",
      text: "Visualize temperature, salinity and currents.",
    },
    {
      id: "visualization",
      icon: "◷",
      title: "Time & Depth",
      text: "Navigate through different temporal and depth layers.",
    },
    {
      id: "visualization",
      icon: "◇",
      title: "Scientific Data",
      text: "Work directly with oceanographic model datasets.",
    },
  ].map((item) => (
    <div
      key={item.title}
      onClick={() => onNavigate?.(item.id)}
      className="cursor-pointer rounded-[12px] border border-[rgba(148,190,215,0.14)] bg-[rgba(255,255,255,0.055)] p-[20px] backdrop-blur-[14px] transition duration-200 hover:-translate-y-1 hover:bg-[rgba(255,255,255,0.08)]"
    >
      <div className="mb-[12px] text-[20px] text-[#5edbff]">
        {item.icon}
      </div>

      <h3 className="m-0 text-[15px] font-semibold text-[#eef9ff]">
        {item.title}
      </h3>

      <p className="m-[8px_0_0] text-[12px] leading-[1.6] text-[rgba(210,225,235,0.65)]">
        {item.text}
      </p>
    </div>
  ))}
</div>

        {/* Footer identity */}
        <div className="mt-[45px] text-[11px] tracking-[0.5px] text-[rgba(190,215,230,0.5)]">
          OCEANIS · 3D Ocean Data Visualization System
        </div>

      </main>
    </div>
  );
}