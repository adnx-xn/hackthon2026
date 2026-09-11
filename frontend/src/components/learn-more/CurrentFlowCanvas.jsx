import React, { useRef, useEffect } from 'react';

/**
 * CurrentFlowCanvas
 *
 * Cinematic high-resolution Indian Ocean scientific map with animated
 * ocean current streamlines inspired by Windy.com and Van Gogh's flowing strokes.
 * 
 * Focuses on:
 * - INDIA, ARABIAN SEA, INDIAN OCEAN, BAY OF BENGAL, SRI LANKA, SOUTHEAST ASIA / INDONESIA
 * 
 * Supports parameters:
 * - 'temperature' (SST: deep blue -> cyan -> green -> yellow -> orange -> red)
 * - 'salinity' (SSS: purple/blue -> cyan -> green -> yellow/gold)
 * - 'vo' (Northward velocity: deep blue -> neutral -> red/amber)
 * - 'uo' (Eastward velocity: deep blue -> neutral -> red/orange)
 */
export default function CurrentFlowCanvas({
  parameter = 'temperature',
  interactive = true,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Geographic bounding box:
    // Lon: 42°E to 102°E
    // Lat: 28°N to -18°S
    const lonMin = 42;
    const lonMax = 104;
    const latMax = 28;
    const latMin = -18;

    function geoToCanvas(lon, lat) {
      const x = ((lon - lonMin) / (lonMax - lonMin)) * width;
      const y = ((latMax - lat) / (latMax - latMin)) * height;
      return [x, y];
    }

    // 1. Vector Field Function for Indian Ocean Currents
    function getVector(x, y) {
      const normX = x / width;
      const normY = y / height;
      const lon = lonMin + normX * (lonMax - lonMin);
      const lat = latMax - normY * (latMax - latMin);

      let u = 0;
      let v = 0;

      // Somali Current (Horn of Africa to Arabian Sea: along lon 48-60, lat -4 to 16)
      if (lon >= 45 && lon <= 65 && lat >= -6 && lat <= 18) {
        const dSomali = Math.hypot((lon - 54) * 0.7, (lat - 6) * 0.4);
        const somaliStrength = Math.exp(-dSomali * 0.35) * 2.2;
        u += somaliStrength * 0.85;
        v += somaliStrength * 1.25; // strong northward flow
      }

      // Arabian Sea clockwise gyre
      if (lon >= 55 && lon <= 75 && lat >= 10 && lat <= 24) {
        const cx = 65;
        const cy = 17;
        const dx = lon - cx;
        const dy = lat - cy;
        const r = Math.hypot(dx, dy);
        if (r > 0.5 && r < 12) {
          const gyre = Math.exp(-Math.pow(r - 5, 2) / 18) * 1.4;
          u += (-dy / r) * gyre;
          v += (dx / r) * gyre;
        }
      }

      // Equatorial Jet (Wyrtki Jet along equator: lon 55 to 96, lat -3 to 3)
      if (lat >= -5 && lat <= 5 && lon >= 50 && lon <= 98) {
        const jetStrength = Math.exp(-Math.pow(lat, 2) / 6.0) * 1.8;
        u += jetStrength * 1.6; // strong eastward flow
        v += Math.sin(lon * 0.15) * 0.2;
      }

      // Bay of Bengal Circulation (cyclonic / anticyclonic gyres)
      if (lon >= 80 && lon <= 96 && lat >= 6 && lat <= 22) {
        const cx = 88;
        const cy = 14;
        const dx = lon - cx;
        const dy = lat - cy;
        const r = Math.hypot(dx, dy);
        if (r > 0.5 && r < 10) {
          const bobStrength = Math.exp(-Math.pow(r - 4, 2) / 14) * 1.2;
          u += (-dy / r) * bobStrength;
          v += (dx / r) * bobStrength;
        }
      }

      // South Equatorial Current (broad westward flow between lat -8 and -18)
      if (lat <= -6 && lat >= -18 && lon >= 50 && lon <= 102) {
        const secStrength = Math.exp(-Math.pow(lat + 12, 2) / 16) * 1.5;
        u -= secStrength * 1.4; // strong westward flow
        v += Math.sin(lon * 0.12) * 0.15;
      }

      // West Coast of India coastal flow
      if (lon >= 68 && lon <= 77 && lat >= 8 && lat <= 20) {
        u += 0.3;
        v -= 0.6;
      }

      // Background gentle drift
      u += 0.2 + Math.sin(normY * 6 + normX * 4) * 0.15;
      v += Math.cos(normX * 5 - normY * 3) * 0.12;

      // Parameter-specific emphasis
      if (parameter === 'vo') {
        v *= 1.4;
      } else if (parameter === 'uo') {
        u *= 1.4;
      }

      return [u, -v]; // -v for canvas Y coordinates
    }

    // 2. Streamline Particle System
    const particleCount = 1400;
    const particles = [];

    function initParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        age: Math.floor(Math.random() * 80),
        maxAge: 60 + Math.random() * 70,
        speed: 0.9 + Math.random() * 0.8,
        history: [],
      };
    }

    // 3. Static Coastlines Coordinates (Indian Ocean Basin)
    // Detailed accurate representation of Indian subcontinent & surrounding regions
    const coastlines = [
      // Indian Peninsula & Pakistan / Bengal
      [
        [68.2, 23.8], [69.5, 22.8], [70.2, 21.0], [71.5, 20.8], [72.8, 21.6],
        [72.8, 19.0], [73.2, 17.0], [74.0, 15.0], [75.0, 13.0], [76.5, 10.0],
        [77.5, 8.1],  // Kanyakumari (Southernmost tip)
        [78.2, 9.2], [79.8, 10.8], [80.3, 13.1], [80.3, 15.9], [82.5, 17.0],
        [85.0, 19.5], [87.0, 21.5], [89.0, 22.0], [90.5, 22.2], [91.5, 21.0],
        [92.2, 20.0], [92.8, 18.0], [94.5, 16.0] // Myanmar coast
      ],
      // Sri Lanka
      [
        [79.8, 9.6], [80.6, 9.8], [81.8, 8.6], [81.8, 7.0], [80.6, 6.0],
        [80.0, 6.0], [79.7, 7.2], [79.8, 9.6]
      ],
      // Arabian Peninsula & Horn of Africa
      [
        [43.5, 12.5], [45.0, 13.0], [50.5, 14.0], [53.5, 16.5], [58.0, 20.5],
        [59.8, 22.5], [57.5, 25.5], [56.0, 26.5]
      ],
      // East Africa / Somalia
      [
        [51.2, 11.8], [49.5, 9.0], [47.5, 5.0], [45.0, 2.0], [43.0, -2.0],
        [40.5, -5.0], [39.0, -10.0], [40.5, -15.0]
      ],
      // Andaman & Nicobar
      [
        [92.8, 13.5], [93.0, 11.5], [92.8, 9.0], [93.5, 7.0]
      ],
      // Sumatra / Indonesia
      [
        [95.2, 5.5], [97.5, 3.5], [99.0, 1.8], [101.5, -0.5], [103.5, -2.8],
        [105.8, -5.5], [105.0, -6.0], [102.5, -4.5], [100.0, -2.0], [97.0, 1.0],
        [95.2, 5.5]
      ]
    ];

    // Resize Handler
    function handleResize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || 600;
      height = rect.height || 520;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(initParticle());
      }
    }

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse Interaction for 3D Tilt Glint
    function handleMouseMove(e) {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left) / rect.width;
      targetMouseY = (e.clientY - rect.top) / rect.height;
    }

    window.addEventListener('mousemove', handleMouseMove);

    // 4. Background Heatmap Drawing
    function drawHeatmap() {
      // Clear canvas with deep base
      ctx.fillStyle = '#020713';
      ctx.fillRect(0, 0, width, height);

      // Gradient thermal zones
      if (parameter === 'temperature') {
        // 1. Equatorial Warm Pool (East Indian Ocean / Bay of Bengal: warm red/orange)
        const [wpX, wpY] = geoToCanvas(85, 2);
        const warmPoolGrad = ctx.createRadialGradient(wpX, wpY, 10, wpX, wpY, width * 0.55);
        warmPoolGrad.addColorStop(0, 'rgba(239, 68, 68, 0.42)');   // Warm red ~31°C
        warmPoolGrad.addColorStop(0.35, 'rgba(249, 115, 22, 0.35)'); // Orange ~29°C
        warmPoolGrad.addColorStop(0.7, 'rgba(234, 179, 8, 0.22)');   // Yellow ~27°C
        warmPoolGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = warmPoolGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Arabian Sea Warm Core (warm yellow/orange ~29°C)
        const [asX, asY] = geoToCanvas(66, 17);
        const asGrad = ctx.createRadialGradient(asX, asY, 5, asX, asY, width * 0.35);
        asGrad.addColorStop(0, 'rgba(249, 115, 22, 0.36)');
        asGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.26)');
        asGrad.addColorStop(0.85, 'rgba(16, 185, 129, 0.16)');
        asGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = asGrad;
        ctx.fillRect(0, 0, width, height);

        // 3. Somali Coastal Cold Upwelling (cold green/cyan wedge ~23°C)
        const [scX, scY] = geoToCanvas(52, 9);
        const somaliGrad = ctx.createRadialGradient(scX, scY, 5, scX, scY, width * 0.28);
        somaliGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');   // Cyan ~23°C
        somaliGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.32)'); // Light Blue
        somaliGrad.addColorStop(0.85, 'rgba(16, 185, 129, 0.18)');
        somaliGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = somaliGrad;
        ctx.fillRect(0, 0, width, height);

        // 4. Southern Indian Ocean Cool Waters (< 22°C deep blue/cyan)
        const [soX, soY] = geoToCanvas(75, -15);
        const soGrad = ctx.createRadialGradient(soX, soY, 10, soX, soY, width * 0.5);
        soGrad.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
        soGrad.addColorStop(0.6, 'rgba(3, 105, 161, 0.25)');
        soGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = soGrad;
        ctx.fillRect(0, 0, width, height);

      } else if (parameter === 'salinity') {
        // Arabian Sea: High Salinity (Gold / Amber / Green ~36.5 PSU)
        const [asX, asY] = geoToCanvas(65, 16);
        const asGrad = ctx.createRadialGradient(asX, asY, 10, asX, asY, width * 0.38);
        asGrad.addColorStop(0, 'rgba(234, 179, 8, 0.45)');   // High salt gold
        asGrad.addColorStop(0.5, 'rgba(34, 197, 94, 0.32)');  // Moderate green
        asGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = asGrad;
        ctx.fillRect(0, 0, width, height);

        // Bay of Bengal: Low Salinity due to massive river runoff (Purple / Indigo ~31.5 PSU)
        const [bobX, bobY] = geoToCanvas(88, 15);
        const bobGrad = ctx.createRadialGradient(bobX, bobY, 10, bobX, bobY, width * 0.38);
        bobGrad.addColorStop(0, 'rgba(168, 85, 247, 0.45)'); // Low salinity purple
        bobGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.35)'); // Blue
        bobGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bobGrad;
        ctx.fillRect(0, 0, width, height);

      } else if (parameter === 'vo') {
        // Northward Velocity: Somali Current (Strong Northward = Amber/Red)
        const [scX, scY] = geoToCanvas(54, 8);
        const scGrad = ctx.createRadialGradient(scX, scY, 10, scX, scY, width * 0.32);
        scGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        scGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.3)');
        scGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = scGrad;
        ctx.fillRect(0, 0, width, height);

        // South Indian Ocean Southward Return Flow (Deep Blue)
        const [soX, soY] = geoToCanvas(75, -12);
        const soGrad = ctx.createRadialGradient(soX, soY, 10, soX, soY, width * 0.4);
        soGrad.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
        soGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = soGrad;
        ctx.fillRect(0, 0, width, height);

      } else if (parameter === 'uo') {
        // Eastward Velocity: Wyrtki Equatorial Jet (Strong Eastward = Crimson/Red)
        const [eqX, eqY] = geoToCanvas(75, 0);
        const eqGrad = ctx.createRadialGradient(eqX, eqY, 10, eqX, eqY, width * 0.45);
        eqGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        eqGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.3)');
        eqGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = eqGrad;
        ctx.fillRect(0, 0, width, height);

        // Westward Velocity: South Equatorial Current (Deep Blue)
        const [secX, secY] = geoToCanvas(75, -14);
        const secGrad = ctx.createRadialGradient(secX, secY, 10, secX, secY, width * 0.42);
        secGrad.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
        secGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = secGrad;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // 5. Geographic Graticules & Labels
    function drawGraticules() {
      ctx.save();
      ctx.strokeStyle = 'rgba(70, 130, 180, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      // Parallels (Equator, 10°N, 20°N, 10°S)
      [-10, 0, 10, 20].forEach(lat => {
        const [, y] = geoToCanvas(lonMin, lat);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(120, 180, 220, 0.35)';
        ctx.font = '10px monospace';
        ctx.fillText(lat === 0 ? 'EQ 0°' : `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`, 12, y - 4);
      });

      // Meridians (60°E, 75°E, 90°E)
      [60, 75, 90].forEach(lon => {
        const [x] = geoToCanvas(lon, latMax);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.fillStyle = 'rgba(120, 180, 220, 0.35)';
        ctx.font = '10px monospace';
        ctx.fillText(`${lon}°E`, x + 4, height - 10);
      });

      ctx.restore();
    }

    // 6. Draw Scientific Vector Coastlines
    function drawCoastlines() {
      ctx.save();
      ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.55)';
      ctx.lineWidth = 1.4;
      ctx.fillStyle = 'rgba(6, 21, 38, 0.85)';

      coastlines.forEach(path => {
        ctx.beginPath();
        path.forEach(([lon, lat], i) => {
          const [x, y] = geoToCanvas(lon, lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.fill();
      });

      // Regional Text Annotations
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.letterSpacing = '1.5px';

      // INDIA
      const [indX, indY] = geoToCanvas(77, 21);
      ctx.fillStyle = 'rgba(235, 245, 255, 0.75)';
      ctx.fillText('INDIA', indX - 18, indY);

      // ARABIAN SEA
      const [asX, asY] = geoToCanvas(64, 15);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.65)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText('ARABIAN SEA', asX - 35, asY);

      // BAY OF BENGAL
      const [bobX, bobY] = geoToCanvas(87, 14);
      ctx.fillText('BAY OF BENGAL', bobX - 38, bobY);

      // SRI LANKA
      const [slX, slY] = geoToCanvas(81.5, 7.5);
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(210, 235, 255, 0.6)';
      ctx.fillText('SRI LANKA', slX + 12, slY);

      // INDIAN OCEAN BASIN
      const [ioX, ioY] = geoToCanvas(76, -7);
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(186, 230, 253, 0.5)';
      ctx.letterSpacing = '3px';
      ctx.fillText('INDIAN OCEAN', ioX - 45, ioY);

      ctx.restore();
    }

    // 7. Render Streamline Particles (Van Gogh / Windy.com current flow)
    function updateAndDrawParticles() {
      ctx.save();
      ctx.lineWidth = 1.2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          const [u, v] = getVector(p.x, p.y);
          const nextX = p.x + u * p.speed * 1.5;
          const nextY = p.y + v * p.speed * 1.5;

          p.history.push([p.x, p.y]);
          if (p.history.length > 8) {
            p.history.shift();
          }

          p.x = nextX;
          p.y = nextY;
          p.age++;
        }

        // Draw particle trail
        if (p.history.length >= 2) {
          const lifeRatio = p.age / p.maxAge;
          const alpha = Math.sin(lifeRatio * Math.PI); // fade in and out

          // Color palette: glowing white-cyan with subtle parameter accents
          let strokeStyle = `rgba(224, 242, 254, ${alpha * 0.55})`;
          if (parameter === 'temperature') {
            strokeStyle = `rgba(186, 230, 253, ${alpha * 0.65})`;
          } else if (parameter === 'salinity') {
            strokeStyle = `rgba(167, 243, 208, ${alpha * 0.65})`;
          }

          ctx.strokeStyle = strokeStyle;
          ctx.beginPath();
          ctx.moveTo(p.history[0][0], p.history[0][1]);
          for (let h = 1; h < p.history.length; h++) {
            ctx.lineTo(p.history[h][0], p.history[h][1]);
          }
          ctx.stroke();

          // Glowing head dot
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }

        // Respawn when old or out of bounds
        if (
          p.age >= p.maxAge ||
          p.x < 0 || p.x > width ||
          p.y < 0 || p.y > height
        ) {
          particles[i] = initParticle();
        }
      }

      ctx.restore();
    }

    // 8. Main Animation Loop
    function render() {
      animationFrameId = requestAnimationFrame(render);

      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Draw layers
      drawHeatmap();
      drawGraticules();
      drawCoastlines();
      updateAndDrawParticles();

      // Atmospheric Vignette & Subtle 3D Depth Glint
      const glintGrad = ctx.createRadialGradient(
        mouseX * width, mouseY * height, 20,
        mouseX * width, mouseY * height, width * 0.7
      );
      glintGrad.addColorStop(0, 'rgba(56, 189, 248, 0.07)');
      glintGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glintGrad;
      ctx.fillRect(0, 0, width, height);

      // Outer border vignette
      const borderVig = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.35,
        width / 2, height / 2, width * 0.75
      );
      borderVig.addColorStop(0, 'transparent');
      borderVig.addColorStop(1, 'rgba(2, 6, 18, 0.85)');
      ctx.fillStyle = borderVig;
      ctx.fillRect(0, 0, width, height);
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [parameter, interactive]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[460px] rounded-[24px] overflow-hidden border border-[rgba(98,217,255,0.22)] bg-[#020713] shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(14,165,233,0.12)] ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Scientific Overlay Badges */}
      <div className="absolute top-[16px] left-[16px] flex items-center gap-[8px] px-[12px] py-[6px] rounded-full bg-[rgba(3,16,33,0.75)] border border-[rgba(98,217,255,0.25)] backdrop-blur-[12px] text-[11px] text-[#7dd3fc] font-medium tracking-[0.8px] uppercase select-none pointer-events-none">
        <span className="w-[6px] h-[6px] rounded-full bg-[#38bdf8] animate-pulse shadow-[0_0_8px_#38bdf8]" />
        INCOIS MODEL DOMAIN · INDIAN OCEAN
      </div>

      <div className="absolute bottom-[16px] right-[16px] flex items-center gap-[6px] px-[12px] py-[5px] rounded-[8px] bg-[rgba(3,16,33,0.7)] border border-[rgba(98,217,255,0.18)] backdrop-blur-[10px] text-[10px] text-[rgba(200,225,242,0.65)] font-mono select-none pointer-events-none">
        40°E–105°E · 28°N–18°S
      </div>
    </div>
  );
}
