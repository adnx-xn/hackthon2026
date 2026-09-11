import React, { useRef, useEffect } from 'react';

export default function GlobalSSTMap({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 480;
    const h = 210;
    canvas.width = w * 2;
    canvas.height = h * 2;
    ctx.scale(2, 2);

    // 1. Draw Global Ocean Sea Surface Temperature Heatmap
    // Background deep polar water
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
    oceanGrad.addColorStop(0, '#1e1b4b');    // Arctic purple/blue
    oceanGrad.addColorStop(0.2, '#1e40af');   // Subpolar blue
    oceanGrad.addColorStop(0.38, '#06b6d4');  // Mid-latitude cyan
    oceanGrad.addColorStop(0.48, '#eab308');  // Subtropical yellow
    oceanGrad.addColorStop(0.55, '#ef4444');  // Equatorial red
    oceanGrad.addColorStop(0.68, '#eab308');  // Southern yellow
    oceanGrad.addColorStop(0.82, '#0284c7');  // Southern ocean blue
    oceanGrad.addColorStop(1, '#312e81');    // Antarctic deep violet
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Tropical Warm Pools (Western Pacific & Indian Ocean fiery zones)
    const wp = ctx.createRadialGradient(w * 0.72, h * 0.52, 10, w * 0.72, h * 0.52, 110);
    wp.addColorStop(0, '#ef4444');
    wp.addColorStop(0.5, '#f97316');
    wp.addColorStop(1, 'transparent');
    ctx.fillStyle = wp;
    ctx.fillRect(0, 0, w, h);

    // Gulf Stream / North Atlantic warm tongue
    const gs = ctx.createRadialGradient(w * 0.36, h * 0.36, 5, w * 0.36, h * 0.36, 75);
    gs.addColorStop(0, '#f97316');
    gs.addColorStop(0.6, '#eab308');
    gs.addColorStop(1, 'transparent');
    ctx.fillStyle = gs;
    ctx.fillRect(0, 0, w, h);

    // 2. Simplified Vector Continents in Dark Indigo/Navy Silhouette
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;

    // North America
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.18);
    ctx.lineTo(w * 0.28, h * 0.16);
    ctx.lineTo(w * 0.32, h * 0.30);
    ctx.lineTo(w * 0.28, h * 0.44);
    ctx.lineTo(w * 0.23, h * 0.48);
    ctx.lineTo(w * 0.18, h * 0.44);
    ctx.lineTo(w * 0.10, h * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // South America
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.52);
    ctx.lineTo(w * 0.33, h * 0.56);
    ctx.lineTo(w * 0.30, h * 0.75);
    ctx.lineTo(w * 0.25, h * 0.86);
    ctx.lineTo(w * 0.22, h * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eurasia
    ctx.beginPath();
    ctx.moveTo(w * 0.46, h * 0.18);
    ctx.lineTo(w * 0.86, h * 0.16);
    ctx.lineTo(w * 0.88, h * 0.35);
    ctx.lineTo(w * 0.78, h * 0.48);
    ctx.lineTo(w * 0.68, h * 0.52); // India
    ctx.lineTo(w * 0.65, h * 0.42);
    ctx.lineTo(w * 0.56, h * 0.44); // Arabia
    ctx.lineTo(w * 0.48, h * 0.36); // Europe
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Africa
    ctx.beginPath();
    ctx.moveTo(w * 0.46, h * 0.40);
    ctx.lineTo(w * 0.58, h * 0.40);
    ctx.lineTo(w * 0.60, h * 0.54);
    ctx.lineTo(w * 0.56, h * 0.74);
    ctx.lineTo(w * 0.48, h * 0.56);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Australia
    ctx.beginPath();
    ctx.moveTo(w * 0.78, h * 0.62);
    ctx.lineTo(w * 0.88, h * 0.62);
    ctx.lineTo(w * 0.86, h * 0.76);
    ctx.lineTo(w * 0.76, h * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Antarctica
    ctx.beginPath();
    ctx.rect(0, h * 0.94, w, h * 0.06);
    ctx.fill();
    ctx.stroke();

    // Subtle graticules
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5); // Equator
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Map display */}
      <div className="relative rounded-[12px] overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-inner">
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>

      {/* Color Scale Legend */}
      <div className="mt-[14px]">
        {/* Gradient strip */}
        <div
          className="h-[10px] w-full rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
          style={{
            background: 'linear-gradient(90deg, #7c3aed 0%, #2563eb 16%, #06b6d4 33%, #22c55e 50%, #eab308 66%, #ea580c 83%, #ec4899 100%)'
          }}
        />

        {/* Tick labels */}
        <div className="flex justify-between items-center text-[10px] font-mono text-[rgba(200,225,242,0.65)] mt-[5px]">
          <span>-2</span>
          <span>5</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
          <span>25</span>
          <span>30</span>
        </div>

        {/* Legend unit title */}
        <div className="text-center text-[11px] text-[rgba(180,210,230,0.7)] mt-[2px] font-medium">
          Sea Surface Temperature (°C)
        </div>
      </div>
    </div>
  );
}
