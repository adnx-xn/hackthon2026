import React from 'react';

export default function BottomWaveDecoration({ className = '' }) {
  return (
    <div className={`relative w-full h-[60px] overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        className="w-full h-full"
        viewBox="0 0 1440 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Wave 1 */}
        <path
          d="M0 45C240 20 480 50 720 30C960 10 1200 40 1440 20"
          stroke="rgba(56, 189, 248, 0.25)"
          strokeWidth="1.2"
        />
        {/* Wave 2 */}
        <path
          d="M0 50C200 35 440 20 720 42C1000 64 1240 25 1440 38"
          stroke="rgba(14, 165, 233, 0.2)"
          strokeWidth="1.4"
        />
        {/* Wave 3 */}
        <path
          d="M0 35C280 55 560 25 840 45C1120 65 1300 30 1440 48"
          stroke="rgba(99, 102, 241, 0.15)"
          strokeWidth="1"
        />
        {/* Wave 4 */}
        <path
          d="M0 25C320 45 640 15 960 35C1280 55 1380 20 1440 30"
          stroke="rgba(56, 189, 248, 0.35)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
