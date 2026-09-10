import React from "react";

export default function Navbar({ currentPage, setCurrentPage }) {
  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const navButtonBaseClass = "relative border-none outline-none py-[9px] px-[17px] rounded-[8px] bg-transparent text-[rgba(205,225,235,0.58)] font-[inherit] text-[12px] font-medium cursor-pointer transition-[color,background,transform] duration-200 hover:text-[#eafaff] hover:bg-[rgba(255,255,255,0.055)] hover:-translate-y-[1px] focus-visible:shadow-[0_0_0_2px_rgba(70,200,255,0.25)] max-[700px]:py-[8px] max-[700px]:px-[10px] max-[700px]:text-[11px] max-[480px]:py-[7px] max-[480px]:px-[8px] max-[480px]:text-[10px]";
  const navButtonActiveClass = "text-[#ffffff] bg-[linear-gradient(135deg,rgba(24,160,220,0.18),rgba(37,99,235,0.14))] shadow-[inset_0_0_0_1px_rgba(90,205,255,0.12),0_4px_15px_rgba(0,130,200,0.08)] after:content-[''] after:absolute after:left-1/2 after:bottom-[3px] after:w-[16px] after:h-[2px] after:-translate-x-1/2 after:rounded-[10px] after:bg-[#58d8ff] after:shadow-[0_0_8px_rgba(88,216,255,0.65)]";

  return (
    <nav className="h-[68px] min-h-[68px] w-full box-border flex items-center justify-between px-[28px] max-[700px]:px-[15px] relative z-[1000] pointer-events-auto bg-gradient-to-b from-[rgba(3,15,29,0.98)] to-[rgba(2,12,24,0.96)] border-b border-[rgba(90,180,220,0.14)] shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-[16px]">
      <div className="flex items-center gap-[11px] select-none">
        <div className="w-[34px] h-[34px] flex items-center justify-center rounded-[9px] text-[#63d9ff] text-[18px] bg-[radial-gradient(circle,rgba(65,210,255,0.22),rgba(20,100,160,0.08))] border border-[rgba(90,210,255,0.2)] shadow-[0_0_18px_rgba(40,190,255,0.08)] max-[480px]:hidden">◉</div>

        <div className="flex flex-col gap-[1px]">
          <span className="text-[#f3fbff] text-[14px] font-bold tracking-[0.8px] max-[700px]:text-[12px] max-[480px]:text-[11px]">INCOIS</span>
          <span className="text-[rgba(190,220,235,0.48)] text-[9px] tracking-[1.1px] uppercase max-[700px]:hidden">3D Ocean Visualization</span>
        </div>
      </div>

      <div className="flex items-center gap-[5px] max-[700px]:gap-[2px] p-[4px] rounded-[11px] bg-[rgba(255,255,255,0.025)] border border-[rgba(140,190,215,0.08)]">
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

        <button
          className={`${navButtonBaseClass} ${currentPage === "about" ? navButtonActiveClass : ""}`}
          onClick={() => handleNavigation("about")}
          aria-current={currentPage === "about" ? "page" : undefined}
        >
          About
        </button>
      </div>
    </nav>
  );
}

