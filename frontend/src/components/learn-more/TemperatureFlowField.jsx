import React, { useRef, useEffect } from 'react';

/**
 * TemperatureFlowField
 *
 * Reproduces the Indian Ocean thermal visualization with animated flowing streamlines
 * matching the provided reference screenshot.
 *
 * Features:
 * - INDIA, ARABIAN SEA, INDIAN OCEAN, BAY OF BENGAL, SRI LANKA, INDONESIA
 * - Vivid thermal heatmap: deep blue -> cyan -> green -> yellow -> orange -> fiery red
 * - Thousands of continuously moving white/cyan current streamlines (Windy.com / Van Gogh style)
 * - Seamless gradient fade on the left edge into the dark navy background
 */
export default function TemperatureFlowField({ className = '' }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = 0;
    let height = 0;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Geographic bounds optimized to frame India in center-left, Arabian Sea to west,
    // Bay of Bengal to east, and Indonesia to southeast
    const lonMin = 44;
    const lonMax = 108;
    const latMax = 27;
    const latMin = -16;

    function geoToCanvas(lon, lat) {
      const x = ((lon - lonMin) / (lonMax - lonMin)) * width;
      const y = ((latMax - lat) / (latMax - latMin)) * height;
      return [x, y];
    }

    // Hydrodynamic Indian Ocean vector field
    function getVector(x, y) {
      const normX = x / width;
      const normY = y / height;
      const lon = lonMin + normX * (lonMax - lonMin);
      const lat = latMax - normY * (latMax - latMin);

      let u = 0;
      let v = 0;

      // 1. Somali Current & Arabian Sea clockwise gyre
      if (lon >= 48 && lon <= 74 && lat >= 6 && lat <= 24) {
        const cx = 64;
        const cy = 15;
        const dx = lon - cx;
        const dy = lat - cy;
        const r = Math.hypot(dx, dy);
        if (r > 0.4 && r < 14) {
          const strength = Math.exp(-Math.pow(r - 5.5, 2) / 22) * 2.2;
          u += (-dy / r) * strength;
          v += (dx / r) * strength;
        }
      }

      // 2. Somali Coastal Jet along Africa (Horn of Africa to Oman)
      if (lon >= 46 && lon <= 62 && lat >= -4 && lat <= 15) {
        const dSomali = Math.hypot((lon - 53) * 0.7, (lat - 6) * 0.4);
        const jet = Math.exp(-dSomali * 0.3) * 2.4;
        u += jet * 0.9;
        v += jet * 1.3;
      }

      // 3. Equatorial Eastward Wyrtki Jet (surges along equator into Indonesia)
      if (lat >= -6 && lat <= 5 && lon >= 52 && lon <= 104) {
        const eqJet = Math.exp(-Math.pow(lat - 0.5, 2) / 8.0) * 2.5;
        u += eqJet * 1.8;
        v += Math.sin(lon * 0.14) * 0.2;
      }

      // 4. Bay of Bengal Circulation
      if (lon >= 80 && lon <= 96 && lat >= 7 && lat <= 22) {
        const cx = 87;
        const cy = 14;
        const dx = lon - cx;
        const dy = lat - cy;
        const r = Math.hypot(dx, dy);
        if (r > 0.5 && r < 11) {
          const bob = Math.exp(-Math.pow(r - 4.5, 2) / 16) * 1.6;
          u += (-dy / r) * bob;
          v += (dx / r) * bob;
        }
      }

      // 5. South Equatorial Current (broad westward sweep below -8°S)
      if (lat <= -6 && lat >= -16 && lon >= 50 && lon <= 106) {
        const sec = Math.exp(-Math.pow(lat + 11, 2) / 18) * 1.8;
        u -= sec * 1.5;
        v += Math.sin(lon * 0.12) * 0.15;
      }

      // Gentle ambient drift
      u += 0.25 + Math.sin(normY * 7 + normX * 5) * 0.2;
      v += Math.cos(normX * 6 - normY * 4) * 0.15;

      return [u, -v]; // -v for canvas screen coordinates
    }

    // Streamline particles
    const particleCount = 1800;
    const particles = [];

    function initParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        age: Math.floor(Math.random() * 80),
        maxAge: 55 + Math.random() * 65,
        speed: 1.1 + Math.random() * 0.9,
        history: [],
      };
    }

    // Accurate scientific coastlines for Indian Ocean region
    const landmasses = [
      // Indian Peninsula
      [
        [68.5, 23.8], [69.8, 22.8], [70.5, 21.0], [72.0, 20.8], [72.8, 21.6],
        [72.8, 19.0], [73.4, 16.8], [74.2, 14.8], [75.2, 12.5], [76.5, 10.0],
        [77.5, 8.1], // Kanyakumari (Southernmost tip)
        [78.2, 9.3], [79.8, 10.8], [80.3, 13.1], [80.5, 16.0], [82.8, 17.2],
        [85.2, 19.8], [87.2, 21.5], [89.2, 22.2], [90.5, 22.4], [91.8, 21.0],
        [92.5, 19.5], [93.2, 17.5], [94.5, 15.8], [95.5, 24.5], [73.5, 26.5],
        [68.5, 23.8]
      ],
      // Sri Lanka
      [
        [79.8, 9.6], [80.6, 9.8], [81.8, 8.6], [81.8, 7.0], [80.8, 5.9],
        [80.0, 6.0], [79.6, 7.2], [79.8, 9.6]
      ],
      // Arabian Peninsula
      [
        [44.0, 12.8], [46.0, 13.2], [51.0, 14.5], [54.0, 17.0], [58.5, 21.0],
        [60.0, 23.0], [57.5, 26.0], [48.0, 26.5], [44.0, 12.8]
      ],
      // East Africa / Somalia
      [
        [51.2, 11.8], [49.5, 9.0], [47.5, 5.0], [45.0, 2.0], [43.0, -2.0],
        [41.0, -6.0], [39.5, -12.0], [44.0, -15.0], [51.2, 11.8]
      ],
      // Indonesia - Sumatra & Java
      [
        [95.2, 5.8], [97.8, 3.6], [99.5, 1.8], [101.8, -0.6], [103.8, -3.0],
        [106.0, -5.8], [107.5, -6.5], [110.5, -7.0], [113.0, -7.5], [114.5, -8.0],
        [112.5, -8.8], [108.5, -8.0], [105.5, -6.8], [102.5, -4.8], [99.8, -2.2],
        [97.0, 0.8], [95.2, 5.8]
      ],
      // Southeast Asia / Malay Peninsula
      [
        [98.5, 14.5], [100.5, 12.5], [101.5, 7.0], [103.5, 2.0], [104.5, 1.3],
        [103.5, 1.8], [101.5, 5.0], [99.8, 9.5], [98.2, 13.0], [98.5, 14.5]
      ]
    ];

    function handleResize() {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width || 800;
      height = rect.height || 420;
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

    // 1. Draw Vivid Thermal Ocean Heatmap
    function drawThermalOcean() {
      // Deep ocean background
      ctx.fillStyle = '#020713';
      ctx.fillRect(0, 0, width, height);

      // --- Major Fiery Thermal Warm Pools ---
      // 1. Central Equatorial Indian Ocean Warm Pool (fiery red/orange)
      const [wpX, wpY] = geoToCanvas(78, -1);
      const wpGrad = ctx.createRadialGradient(wpX, wpY, 15, wpX, wpY, width * 0.48);
      wpGrad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');   // Deep red ~31°C
      wpGrad.addColorStop(0.35, 'rgba(249, 115, 22, 0.88)'); // Orange ~29.5°C
      wpGrad.addColorStop(0.7, 'rgba(234, 179, 8, 0.72)');   // Golden yellow ~28°C
      wpGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = wpGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Arabian Sea Warm Core (intense orange/yellow)
      const [asX, asY] = geoToCanvas(66, 16);
      const asGrad = ctx.createRadialGradient(asX, asY, 10, asX, asY, width * 0.32);
      asGrad.addColorStop(0, 'rgba(249, 115, 22, 0.92)');
      asGrad.addColorStop(0.45, 'rgba(234, 179, 8, 0.82)');
      asGrad.addColorStop(0.75, 'rgba(16, 185, 129, 0.55)');
      asGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = asGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Bay of Bengal Warm Layer (vibrant red/orange)
      const [bobX, bobY] = geoToCanvas(88, 14);
      const bobGrad = ctx.createRadialGradient(bobX, bobY, 10, bobX, bobY, width * 0.35);
      bobGrad.addColorStop(0, 'rgba(239, 68, 68, 0.92)');
      bobGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.82)');
      bobGrad.addColorStop(0.75, 'rgba(234, 179, 8, 0.6)');
      bobGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bobGrad;
      ctx.fillRect(0, 0, width, height);

      // 4. Indonesian Warm Pool / Throughflow
      const [indoX, indoY] = geoToCanvas(100, -3);
      const indoGrad = ctx.createRadialGradient(indoX, indoY, 10, indoX, indoY, width * 0.35);
      indoGrad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
      indoGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.85)');
      indoGrad.addColorStop(0.8, 'rgba(234, 179, 8, 0.6)');
      indoGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = indoGrad;
      ctx.fillRect(0, 0, width, height);

      // 5. Somali Cold Upwelling Wedge (cyan/green cold tongue)
      const [scX, scY] = geoToCanvas(52, 9);
      const scGrad = ctx.createRadialGradient(scX, scY, 5, scX, scY, width * 0.22);
      scGrad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');    // Cyan ~23°C
      scGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.65)'); // Green
      scGrad.addColorStop(0.85, 'rgba(14, 165, 233, 0.4)');
      scGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scGrad;
      ctx.fillRect(0, 0, width, height);

      // 6. Southern Indian Ocean Cool Transition (< 22°C deep blue/cyan)
      const [soX, soY] = geoToCanvas(78, -14);
      const soGrad = ctx.createRadialGradient(soX, soY, 15, soX, soY, width * 0.45);
      soGrad.addColorStop(0, 'rgba(2, 132, 199, 0.8)');
      soGrad.addColorStop(0.5, 'rgba(3, 105, 161, 0.7)');
      soGrad.addColorStop(0.8, 'rgba(30, 58, 138, 0.85)');
      soGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = soGrad;
      ctx.fillRect(0, 0, width, height);

      // 7. Northwest Edge (Red Sea / Gulf of Aden)
      const [nwX, nwY] = geoToCanvas(46, 14);
      const nwGrad = ctx.createRadialGradient(nwX, nwY, 5, nwX, nwY, width * 0.2);
      nwGrad.addColorStop(0, 'rgba(2, 132, 199, 0.6)');
      nwGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nwGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Scientific Landmasses with Subtle Terrain Contours
    function drawLandmasses() {
      ctx.save();
      // Land shadow & dark fill
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#061324';
      ctx.strokeStyle = 'rgba(100, 210, 255, 0.35)';
      ctx.lineWidth = 1.2;

      landmasses.forEach((path) => {
        ctx.beginPath();
        path.forEach(([lon, lat], i) => {
          const [x, y] = geoToCanvas(lon, lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // Regional Labels matching reference screenshot
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.letterSpacing = '2px';

      // INDIA
      const [indX, indY] = geoToCanvas(77.5, 18.5);
      ctx.fillText('INDIA', indX - 18, indY);

      // ARABIAN SEA
      const [asX, asY] = geoToCanvas(62.5, 14.5);
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.fillText('ARABIAN', asX - 22, asY - 5);
      ctx.fillText('SEA', asX - 10, asY + 9);

      // INDIAN OCEAN
      const [ioX, ioY] = geoToCanvas(76.5, -6.5);
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('INDIAN', ioX - 18, ioY - 5);
      ctx.fillText('OCEAN', ioX - 18, ioY + 9);

      // INDONESIA
      const [idX, idY] = geoToCanvas(99.5, -4.0);
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.fillText('INDONESIA', idX - 28, idY);

      ctx.restore();
    }

    // 3. Draw Moving Streamlines (Van Gogh / Windy current effect)
    function drawStreamlines() {
      ctx.save();
      ctx.lineWidth = 1.25;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          const [u, v] = getVector(p.x, p.y);
          p.history.push([p.x, p.y]);
          if (p.history.length > 9) {
            p.history.shift();
          }

          p.x += u * p.speed * 1.5;
          p.y += v * p.speed * 1.5;
          p.age++;
        }

        // Draw particle trail
        if (p.history.length >= 2) {
          const lifeRatio = p.age / p.maxAge;
          const alpha = Math.sin(lifeRatio * Math.PI); // smooth fade in and out

          // Luminous white/cyan current lines
          ctx.strokeStyle = `rgba(240, 249, 255, ${alpha * 0.65})`;
          ctx.beginPath();
          ctx.moveTo(p.history[0][0], p.history[0][1]);
          for (let h = 1; h < p.history.length; h++) {
            ctx.lineTo(p.history[h][0], p.history[h][1]);
          }
          ctx.stroke();

          // Glowing head
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 0.95, 0, Math.PI * 2);
          ctx.fill();
        }

        // Respawn when old or out of canvas bounds
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

    // 4. Main Render Loop
    function render() {
      animId = requestAnimationFrame(render);

      drawThermalOcean();
      drawLandmasses();
      drawStreamlines();

      // Atmospheric Vignette on outer bounds
      const vig = ctx.createRadialGradient(
        width * 0.6, height * 0.5, width * 0.25,
        width * 0.6, height * 0.5, width * 0.75
      );
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(2, 6, 18, 0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] lg:min-h-[440px] overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Seamless Left-to-Right Fade Mask into dark background behind hero text */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#020817] via-[#020817]/70 via-35% to-transparent to-60%" />

      {/* Bottom subtle fade into the Why It Matters section */}
      <div className="absolute bottom-0 inset-x-0 h-[40px] pointer-events-none bg-gradient-to-t from-[#020817] to-transparent" />
    </div>
  );
}
