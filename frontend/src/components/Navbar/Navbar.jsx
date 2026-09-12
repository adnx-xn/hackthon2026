import React from "react";

import LearnMoreDropdown from "../learn-more/LearnMoreDropdown";

export default function Navbar({ currentPage, setCurrentPage }) {
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const navButtonBaseClass = "relative border-none outline-none py-[9px] px-[17px] rounded-[8px] bg-transparent text-[rgba(205,225,235,0.58)] font-[inherit] text-[12px] font-medium cursor-pointer transition-[color,background,transform] duration-200 hover:text-[#eafaff] hover:bg-[rgba(255,255,255,0.055)] hover:-translate-y-[1px] focus-visible:shadow-[0_0_0_2px_rgba(70,200,255,0.25)] max-[700px]:py-[8px] max-[700px]:px-[10px] max-[700px]:text-[11px] max-[480px]:py-[7px] max-[480px]:px-[8px] max-[480px]:text-[10px]";
  const navButtonActiveClass = "text-[#ffffff] bg-[linear-gradient(135deg,rgba(24,160,220,0.18),rgba(37,99,235,0.14))] shadow-[inset_0_0_0_1px_rgba(90,205,255,0.12),0_4px_15px_rgba(0,130,200,0.08)] after:content-[''] after:absolute after:left-1/2 after:bottom-[3px] after:w-[16px] after:h-[2px] after:-translate-x-1/2 after:rounded-[10px] after:bg-[#58d8ff] after:shadow-[0_0_8px_rgba(88,216,255,0.65)]";

  return (
    <nav className="h-[64px] min-h-[64px] w-full box-border flex items-center justify-between px-[28px] max-[700px]:px-[16px] relative z-[1000] pointer-events-auto bg-[#020817]/90 border-b border-[rgba(255,255,255,0.07)] shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-[16px]">
      {/* Left: Oceanis logo */}
      <div
        className="flex items-center gap-[10px] select-none cursor-pointer"
        onClick={() => handleNavigation("home")}
      >
        <svg
          className="w-6 h-6 text-[#38bdf8]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        </svg>

        <span className="text-white text-[16px] font-bold tracking-[0.4px]">
          Oceanis
        </span>
      </div>

      {/* Center: Navigation */}
      <div className="flex items-center gap-[6px] max-[700px]:gap-[2px]">
        <button
          className={`${navButtonBaseClass} ${currentPage === "home" ? navButtonActiveClass : ""}`}
          onClick={() => handleNavigation("home")}
          aria-current={currentPage === "home" ? "page" : undefined}
        >
          Home
        </button>

        <button
          className={`${navButtonBaseClass} ${currentPage === "visualization" ? navButtonActiveClass : ""}`}
          onClick={() => handleNavigation("visualization")}
          aria-current={
            currentPage === "visualization" ? "page" : undefined
          }
        >
          Visualization
        </button>

        <LearnMoreDropdown
          currentPage={currentPage}
          onNavigate={handleNavigation}
          navButtonBaseClass={navButtonBaseClass}
          navButtonActiveClass={navButtonActiveClass}
        />

        <button
          className={`${navButtonBaseClass} ${currentPage === "about" ? navButtonActiveClass : ""}`}
          onClick={() => handleNavigation("about")}
          aria-current={currentPage === "about" ? "page" : undefined}
        >
          About
        </button>
      </div>

      {/* Right: Dark mode moon icon */}
      <div className="flex items-center gap-[12px] text-[rgba(200,225,242,0.6)] select-none">
        <div className="w-[5px] h-[5px] rounded-full bg-[#38bdf8]/50" />
        <button
          aria-label="Toggle Theme"
          className="border-none bg-transparent text-[rgba(200,225,242,0.6)] hover:text-white transition-colors cursor-pointer p-1 flex items-center justify-center"
        >
          <svg
            className="w-[17px] h-[17px]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

