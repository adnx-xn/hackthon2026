import React, { useState, useRef, useEffect } from 'react';

export default function LearnMoreDropdown({ currentPage, onNavigate, navButtonBaseClass, navButtonActiveClass }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isLearnMoreActive =
    currentPage?.startsWith('learn-more') ||
    currentPage?.startsWith('/learn-more');

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [
    {
      label: 'Temperature',
      route: 'learn-more/temperature',
      symbol: '🌡️',
      desc: 'Sea surface & subsurface heat distribution',
    },
    {
      label: 'Salinity',
      route: 'learn-more/salinity',
      symbol: '🧂',
      desc: 'Practical Salinity Units & density halocline',
    },
    {
      label: 'VO — Northward Velocity',
      route: 'learn-more/vo',
      symbol: '🧭',
      desc: 'Meridional current flow & Somali surge',
    },
    {
      label: 'UO — Eastward Velocity',
      route: 'learn-more/uo',
      symbol: '↔️',
      desc: 'Zonal currents & Wyrtki equatorial jets',
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${navButtonBaseClass} flex items-center gap-[6px] ${
          isLearnMoreActive ? navButtonActiveClass : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Learn More</span>
        <span className={`text-[10px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-[8px] w-[260px] rounded-[16px] border border-[rgba(98,217,255,0.22)] bg-[rgba(3,15,30,0.95)] backdrop-blur-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.6)] py-[8px] z-[2000] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-[14px] py-[6px] text-[10px] font-mono tracking-[1.5px] uppercase text-[#63d9ff] border-b border-[rgba(255,255,255,0.06)] mb-[4px]">
            Ocean Parameters
          </div>

          {items.map((item) => {
            const isItemActive =
              currentPage === item.route || currentPage === `/${item.route}`;

            return (
              <button
                key={item.route}
                onClick={() => {
                  onNavigate(item.route);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-[14px] py-[10px] flex items-start gap-[10px] transition-colors cursor-pointer border-none bg-transparent ${
                  isItemActive
                    ? 'bg-[rgba(14,165,233,0.18)] text-white'
                    : 'text-[rgba(215,235,248,0.78)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white'
                }`}
              >
                <span className="text-[16px] mt-[1px]">{item.symbol}</span>
                <div>
                  <div className="text-[13px] font-semibold leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[rgba(180,210,230,0.5)] mt-[2px] leading-snug">
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
