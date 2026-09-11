import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function Salinity({ onNavigate }) {
  const mountRef = useRef(null);
  const [waveSpeed, setWaveSpeed] = useState(1.0);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveWaveSpeed = prefersReducedMotion ? 0.2 : waveSpeed;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020a17, 0.022);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 16, 22);
    camera.lookAt(0, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f2b48, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xe0f2fe, 3.2);
    sunLight.position.set(12, 24, 14);
    scene.add(sunLight);

    const cyanFillLight = new THREE.DirectionalLight(0x06b6d4, 1.5);
    cyanFillLight.position.set(-15, 10, -10);
    scene.add(cyanFillLight);

    const bottomGlow = new THREE.PointLight(0x0284c7, 2.5, 30);
    bottomGlow.position.set(0, -6, 0);
    scene.add(bottomGlow);

    // 3. Indian Ocean 3D Basin with Realistic Waves & Salinity Color Field
    // Map bounds approximately: Lon 45°E to 105°E (X: -15 to +15), Lat -25°S to +25°N (Z: 14 to -14)
    const gridX = 140;
    const gridZ = 120;
    const oceanGeo = new THREE.PlaneGeometry(30, 26, gridX, gridZ);
    oceanGeo.rotateX(-Math.PI / 2);

    // Compute Base Salinity Distribution and Masking
    // High Salinity: Arabian Sea (North-West) ~36.5 - 38 PSU (warm yellow/orange/red)
    // Low Salinity: Bay of Bengal (North-East) ~29 - 31.5 PSU (deep blue/cyan/green from freshwater rivers)
    // Moderate Salinity: Southern Indian Ocean ~34.5 - 35.5 PSU
    const pos = oceanGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const baseSalinity = new Float32Array(pos.count);
    const isLand = new Uint8Array(pos.count);

    // Color gradient stops for PSU:
    // 28 PSU: Deep Blue (0.08, 0.20, 0.58)
    // 30 PSU: Sky Blue   (0.04, 0.65, 0.95)
    // 32 PSU: Cyan/Green (0.05, 0.82, 0.65)
    // 34 PSU: Yellow     (0.92, 0.85, 0.12)
    // 36 PSU: Orange     (0.96, 0.48, 0.08)
    // 38 PSU: Red/Coral  (0.94, 0.20, 0.20)
    function getSalinityColor(psu) {
      const stops = [
        { psu: 28, c: [0.06, 0.22, 0.65] },
        { psu: 30, c: [0.03, 0.62, 0.90] },
        { psu: 32, c: [0.06, 0.78, 0.60] },
        { psu: 34, c: [0.88, 0.82, 0.14] },
        { psu: 36, c: [0.95, 0.46, 0.08] },
        { psu: 38, c: [0.92, 0.16, 0.18] },
      ];

      if (psu <= stops[0].psu) return stops[0].c;
      if (psu >= stops[stops.length - 1].psu) return stops[stops.length - 1].c;

      for (let i = 0; i < stops.length - 1; i++) {
        if (psu >= stops[i].psu && psu <= stops[i + 1].psu) {
          const t = (psu - stops[i].psu) / (stops[i + 1].psu - stops[i].psu);
          return [
            stops[i].c[0] + t * (stops[i + 1].c[0] - stops[i].c[0]),
            stops[i].c[1] + t * (stops[i + 1].c[1] - stops[i].c[1]),
            stops[i].c[2] + t * (stops[i + 1].c[2] - stops[i].c[2]),
          ];
        }
      }
      return [0.1, 0.5, 0.8];
    }

    // Determine geographic regions for vertices
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Geographical Approximation:
      // x: -15 (East Africa / Arabia) to +15 (Indonesia/Australia)
      // z: -13 (North: India, Pakistan, Bay of Bengal) to +13 (South Indian Ocean)
      
      let land = false;

      // 1. India triangular peninsula (jutting southward between Arabian Sea and Bay of Bengal)
      if (z < -1.8 && z > -13.0) {
        const halfWidth = 0.38 * (z + 13.0); // narrow at south tip (z=-1.8), wider at north (z=-13)
        if (Math.abs(x - 0.5) < halfWidth) {
          land = true;
        }
      }
      // 2. Sri Lanka (island at SE of India tip: x ~ 2.2, z ~ -0.8)
      const distSriLanka = Math.hypot(x - 2.0, z - (-0.6));
      if (distSriLanka < 0.9) land = true;

      // 3. Arabian Peninsula (NW: x < -6, z < -4)
      if (x < -6.5 && z < -4 && (z < -8 || x < -9)) land = true;

      // 4. Sumatra / Indonesian arch (SE: diagonal chain x > 8.5 to 14, z from -4 to 6)
      const sumatraLine = (x - 8.5) * 0.9 + (z + 3) * 0.4;
      if (x > 7.5 && Math.abs(sumatraLine - 3.2) < 1.2 && z > -5 && z < 7) {
        land = true;
      }

      isLand[i] = land ? 1 : 0;

      // Base Salinity computation (PSU):
      let psu = 34.6; // Baseline equatorial PSU

      if (land) {
        psu = 34.0;
      } else if (x < 0 && z < 1) {
        // Arabian Sea: High evaporation, arid surrounds -> High Salinity 36.2 - 38.2 PSU
        const intensity = Math.min(1, Math.max(0, (-x / 8) * 0.7 + (-z / 10) * 0.6));
        psu = 35.2 + intensity * 2.8;
      } else if (x > 0 && z < 2) {
        // Bay of Bengal: Massive freshwater influx (Ganga, Brahmaputra, Irrawaddy) -> Low Salinity 28.5 - 31.8 PSU
        const intensity = Math.min(1, Math.max(0, (x / 9) * 0.5 + (-z / 11) * 0.7));
        psu = 34.0 - intensity * 5.0;
      } else {
        // Southern Indian Ocean / Equatorial band: Gradual transition ~34.2 - 35.4 PSU
        const latGrad = (z / 13) * 0.7;
        psu = 34.6 + latGrad;
      }

      baseSalinity[i] = psu;

      if (land) {
        // Stylized dark landmass with cyan coastal trim
        colors[i * 3 + 0] = 0.05;
        colors[i * 3 + 1] = 0.09;
        colors[i * 3 + 2] = 0.16;
      } else {
        const [r, g, b] = getSalinityColor(psu);
        colors[i * 3 + 0] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }

      // Add gentle spherical curvature towards edges for floating planetoid look
      const r2 = (x * x) / 240 + (z * z) / 200;
      pos.setY(i, land ? 0.35 : -r2 * 1.2);
    }

    oceanGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    oceanGeo.computeVertexNormals();

    // Ocean Material with animated wave displacement, specular highlights, and salinity gradient
    const oceanMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.18,
      metalness: 0.65,
      flatShading: false,
      wireframe: false,
    });

    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMaterial);
    scene.add(oceanMesh);

    // 4. Subtle Outer Atmosphere Glow Ring
    const ringGeo = new THREE.RingGeometry(16.5, 17.8, 64);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = -1.8;
    scene.add(ringMesh);

    // 5. Salinity Current Streamlines & Particles (NASA ECCO inspired)
    // Representing surface current swirls: Somali Jet, Arabian Sea gyre, Bay of Bengal cyclonic eddy, Equatorial drift
    const particleCount = 650;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleData = [];

    for (let p = 0; p < particleCount; p++) {
      const regime = Math.random() < 0.4 ? 0 : Math.random() < 0.7 ? 1 : 2;
      let px, pz, radius, speed, angle;

      if (regime === 0) {
        // Arabian Sea clockwise loop
        radius = 2.0 + Math.random() * 4.5;
        angle = Math.random() * Math.PI * 2;
        px = -5.5 + Math.cos(angle) * radius;
        pz = -4.5 + Math.sin(angle) * radius * 0.7;
        speed = 0.018 + Math.random() * 0.015;
      } else if (regime === 1) {
        // Bay of Bengal counter-clockwise eddy
        radius = 1.8 + Math.random() * 4.0;
        angle = Math.random() * Math.PI * 2;
        px = 5.5 + Math.cos(angle) * radius;
        pz = -4.0 + Math.sin(angle) * radius * 0.75;
        speed = -0.015 - Math.random() * 0.012;
      } else {
        // Equatorial drift (West to East)
        px = -13 + Math.random() * 26;
        pz = 2.0 + (Math.random() - 0.5) * 5.0;
        angle = 0;
        radius = 0;
        speed = 0.035 + Math.random() * 0.03;
      }

      particlePositions[p * 3 + 0] = px;
      particlePositions[p * 3 + 1] = 0.2;
      particlePositions[p * 3 + 2] = pz;

      particleData.push({ regime, radius, angle, speed, px, pz });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Particle Material with glowing point texture
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const pctx = particleCanvas.getContext('2d');
    const grad = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.35, 'rgba(34, 211, 238, 0.85)');
    grad.addColorStop(0.8, 'rgba(14, 165, 233, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 32, 32);

    const pTexture = new THREE.CanvasTexture(particleCanvas);
    const particleMat = new THREE.PointsMaterial({
      size: 0.55,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Geographic Markers (Floating 3D Pins)
    const regions = [
      { name: 'Arabian Sea', psu: '36.8 PSU', x: -6.0, z: -4.5, desc: 'High Evaporation Core' },
      { name: 'Bay of Bengal', psu: '30.5 PSU', x: 6.2, z: -4.8, desc: 'River Discharge Dilution' },
      { name: 'Equatorial Current', psu: '34.8 PSU', x: 0.0, z: 2.5, desc: 'Mixed Water Mass' },
    ];

    const markerGroup = new THREE.Group();
    regions.forEach((reg) => {
      const pinGeo = new THREE.ConeGeometry(0.28, 0.8, 16);
      pinGeo.rotateX(Math.PI);
      const pinMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(reg.x, 0.7, reg.z);
      markerGroup.add(pinMesh);

      // Halo ring
      const haloGeo = new THREE.RingGeometry(0.35, 0.5, 24);
      haloGeo.rotateX(-Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(reg.x, 0.15, reg.z);
      markerGroup.add(haloMesh);
    });
    scene.add(markerGroup);

    // 7. Interactive Mouse Parallax & Orbit
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.003;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 8. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const initialPositions = pos.clone();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime() * effectiveWaveSpeed;

      // Animate Realistic Multi-Octave Ocean Waves
      const currentPos = oceanGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        if (isLand[i]) continue; // Keep land stable

        const x = initialPositions.getX(i);
        const z = initialPositions.getZ(i);
        const baseY = initialPositions.getY(i);

        // Realistic Gerstner / multi-frequency ocean wave formula
        const w1 = Math.sin(x * 0.65 + time * 1.8) * 0.18;
        const w2 = Math.cos(z * 0.85 + time * 1.4) * 0.14;
        const w3 = Math.sin((x + z) * 0.45 + time * 2.2) * 0.09;
        const w4 = Math.cos(Math.hypot(x, z) * 0.7 - time * 1.6) * 0.06;

        currentPos.setY(i, baseY + w1 + w2 + w3 + w4);
      }
      currentPos.needsUpdate = true;
      oceanGeo.computeVertexNormals();

      // Animate Current Particles
      const pArr = particleGeo.attributes.position.array;
      for (let p = 0; p < particleCount; p++) {
        const pData = particleData[p];
        if (pData.regime === 0) {
          pData.angle += pData.speed * effectiveWaveSpeed;
          pArr[p * 3 + 0] = -5.5 + Math.cos(pData.angle) * pData.radius;
          pArr[p * 3 + 2] = -4.5 + Math.sin(pData.angle) * pData.radius * 0.7;
        } else if (pData.regime === 1) {
          pData.angle += pData.speed * effectiveWaveSpeed;
          pArr[p * 3 + 0] = 5.5 + Math.cos(pData.angle) * pData.radius;
          pArr[p * 3 + 2] = -4.0 + Math.sin(pData.angle) * pData.radius * 0.75;
        } else {
          pArr[p * 3 + 0] += pData.speed * effectiveWaveSpeed;
          if (pArr[p * 3 + 0] > 13.5) pArr[p * 3 + 0] = -13.5;
        }

        // Keep particles slightly above wave crests
        const sampleX = pArr[p * 3 + 0];
        const sampleZ = pArr[p * 3 + 2];
        const waveLift =
          Math.sin(sampleX * 0.65 + time * 1.8) * 0.18 +
          Math.cos(sampleZ * 0.85 + time * 1.4) * 0.14;
        pArr[p * 3 + 1] = 0.25 + waveLift;
      }
      particleGeo.attributes.position.needsUpdate = true;

      // Auto-rotation & mouse parallax
      if (isRotating && !isDragging) {
        targetRotationY += 0.0012;
      }
      oceanMesh.rotation.y += (targetRotationY - oceanMesh.rotation.y) * 0.05;
      oceanMesh.rotation.x += (targetRotationX - oceanMesh.rotation.x) * 0.05;
      particles.rotation.y = oceanMesh.rotation.y;
      particles.rotation.x = oceanMesh.rotation.x;
      markerGroup.rotation.y = oceanMesh.rotation.y;
      markerGroup.rotation.x = oceanMesh.rotation.x;

      camera.position.x += (mouseX * 2.5 - camera.position.x) * 0.03;
      camera.position.y += (16 + mouseY * 1.8 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 1);

      renderer.render(scene, camera);
    };

    animate();

    // 9. Handle Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);

      oceanGeo.dispose();
      oceanMaterial.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      pTexture.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [waveSpeed, isRotating]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#020817] text-white font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif] selection:bg-cyan-500/30 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[750px] h-[550px] rounded-full bg-cyan-500/[0.04] blur-[150px]" />
        <div className="absolute top-1/3 right-[-120px] w-[600px] h-[600px] rounded-full bg-blue-600/[0.05] blur-[170px]" />
        <div className="absolute bottom-0 left-1/3 w-[850px] h-[450px] rounded-full bg-[#031426] blur-[140px]" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1580px] mx-auto px-5 sm:px-8 lg:px-12 pt-6 pb-16">
        {/* =========================================================================
            HERO SECTION — 3D Visualizer & Scientific Context
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.55fr] gap-8 items-start mb-8">
          
          {/* LEFT: Heading, Short Scientific Context & Key Metric Cards */}
          <div className="flex flex-col justify-start pt-2">
            {/* Tag / Icon */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[46px] h-[46px] rounded-full border border-cyan-400/60 bg-cyan-500/10 flex items-center justify-center text-[22px] shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                💧
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
                  Ocean Parameter
                </span>
                <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-tight text-white m-0">
                  Salinity
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            <h2 className="text-[17px] sm:text-[19px] font-medium text-cyan-100/90 mb-3 tracking-tight">
              The Ocean's Balance of Salt
            </h2>

            {/* Short Explanatory Text */}
            <p className="text-[13.5px] sm:text-[14px] leading-[1.65] text-slate-300 mb-5 max-w-[530px]">
              Salinity describes the concentration of dissolved salts in seawater. Together with temperature, it influences seawater density, circulation, and the structure of the ocean.
            </p>

            {/* Quick Interactive Control Bar */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6 p-2 rounded-xl bg-[#031426]/70 border border-cyan-500/20 backdrop-blur-md">
              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                  isRotating
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {isRotating ? '⏸ Pause Orbit' : '▶ Auto Orbit'}
              </button>

              <div className="h-4 w-px bg-slate-700/60" />

              <span className="text-[11px] text-slate-400">Wave Swell:</span>
              {[0.5, 1.0, 1.8].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setWaveSpeed(spd)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    waveSpeed === spd
                      ? 'bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {spd === 0.5 ? 'Gentle' : spd === 1.0 ? 'Normal' : 'Surge'}
                </button>
              ))}
            </div>

            {/* Scientific Call to Action */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate && onNavigate('visualization')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[13px] font-semibold tracking-wide shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Launch 3D Visualizer</span>
                <span className="text-[15px]">→</span>
              </button>
              <span className="text-[11.5px] text-slate-400 font-mono">
                PSU: Practical Salinity Unit
              </span>
            </div>
          </div>

          {/* RIGHT: 3D Ocean Surface Visualizer with Integrated Glass HUD */}
          <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] rounded-2xl overflow-hidden border border-cyan-500/25 bg-gradient-to-b from-[#020b18] to-[#010611] shadow-[0_0_40px_rgba(8,145,178,0.15)] group">
            {/* 3D WebGL Canvas Container */}
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Top Overlay Badge */}
            <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#020817]/80 border border-cyan-400/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-cyan-200">
                INDIAN OCEAN BASIN · 3D REAL-TIME SURFACE
              </span>
            </div>

            {/* Interaction Hint */}
            <div className="absolute top-4 right-4 pointer-events-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#020817]/60 border border-slate-700/40 backdrop-blur-sm text-[10px] text-slate-400">
              <span>🖱 Drag to Rotate · Scroll to Zoom</span>
            </div>

            {/* Salinity Distribution Floating Colorbar */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-[380px] p-3.5 rounded-xl bg-[#031426]/85 border border-cyan-500/30 backdrop-blur-md shadow-xl pointer-events-auto">
              <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-100 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  SALINITY DISTRIBUTION
                </span>
                <span className="font-mono text-slate-400 text-[10px]">28 – 38 PSU</span>
              </div>

              {/* Scientific Salinity Gradient */}
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#0f3b9c] via-[#0284c7] via-[#059669] via-[#ca8a04] via-[#ea580c] to-[#dc2626] shadow-inner mb-1.5" />

              {/* Gradient Ticks */}
              <div className="flex justify-between text-[10px] font-mono text-slate-300">
                <span>28 PSU</span>
                <span>30 PSU</span>
                <span>32 PSU</span>
                <span>34 PSU</span>
                <span>36 PSU</span>
                <span>38 PSU</span>
              </div>

              {/* Sub-label */}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-slate-400">
                <span className="text-cyan-300 font-medium">← Fresh (Bay of Bengal)</span>
                <span className="text-amber-300 font-medium">Saline (Arabian Sea) →</span>
              </div>
            </div>

            {/* Region Callout Indicators */}
            <div className="absolute bottom-4 right-4 hidden md:flex flex-col gap-1.5 pointer-events-none">
              <div className="px-2.5 py-1 rounded bg-[#020b18]/80 border border-amber-500/30 backdrop-blur-sm text-[10px] text-amber-200">
                <strong>Arabian Sea:</strong> High Evaporation (~36.8 PSU)
              </div>
              <div className="px-2.5 py-1 rounded bg-[#020b18]/80 border border-cyan-500/30 backdrop-blur-sm text-[10px] text-cyan-200">
                <strong>Bay of Bengal:</strong> River Dilution (~30.5 PSU)
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            SUPPORTING SCIENTIFIC CONTENT CARDS
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: WHY IT MATTERS */}
          <div className="p-6 rounded-2xl bg-[#031426]/60 border border-cyan-500/20 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-[16px]">
                ✦
              </div>
              <h3 className="text-[17px] font-bold text-white tracking-tight m-0">
                Why It Matters
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 text-[11px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-cyan-200 m-0">Ocean Circulation</h4>
                  <p className="text-[12px] leading-relaxed text-slate-300/90 mt-0.5 m-0">
                    Drives global thermohaline conveyor belts by modulating seawater density.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 text-[11px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-cyan-200 m-0">Marine Ecosystems</h4>
                  <p className="text-[12px] leading-relaxed text-slate-300/90 mt-0.5 m-0">
                    Governs osmotic balance and nutrient availability for coastal and pelagic species.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 text-[11px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-cyan-200 m-0">Water Density</h4>
                  <p className="text-[12px] leading-relaxed text-slate-300/90 mt-0.5 m-0">
                    Controls vertical stratification, internal waves, and deep water mass formation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-[11px] shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-cyan-200 m-0">Climate Regulation</h4>
                  <p className="text-[12px] leading-relaxed text-slate-300/90 mt-0.5 m-0">
                    Tracks the planetary water cycle, evaporation rates, and monsoon rainfall intensity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: HOW IT'S USED */}
          <div className="p-6 rounded-2xl bg-[#031426]/60 border border-cyan-500/20 backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/40 flex items-center justify-center text-blue-300 text-[16px]">
                ⚙
              </div>
              <h3 className="text-[17px] font-bold text-white tracking-tight m-0">
                How It's Used
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 text-[14px] mt-0.5">✓</span>
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-100 m-0">Tracking Water Masses</h4>
                  <p className="text-[12px] leading-relaxed text-slate-300/90 mt-0.5 m-0">
                    Pinpoints the geographic origin and spreading routes of deep abyssal ocean currents.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-cyan-400 text-[14px] mt-0.5">✓</span>
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-100 m-0">Studying Ocean Circulation</h4>
                  <p className="text-[12px] leading-relaxed text-slate-300/90 mt-0.5 m-0">
                    Calculates geostrophic current velocities when combined with temperature profiles.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-cyan-400 text-[14px] mt-0.5">✓</span>
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-100 m-0">Monitoring Freshwater Influence</h4>
                  <p className="text-[12px] leading-relaxed text-slate-300/90 mt-0.5 m-0">
                    Quantifies river runoff plumes from the Ganges and Brahmaputra into the Bay of Bengal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-cyan-400 text-[14px] mt-0.5">✓</span>
                <div>
                  <h4 className="text-[13px] font-semibold text-slate-100 m-0">Understanding Climate Patterns</h4>
                  <p className="text-[12px] leading-relaxed text-slate-300/90 mt-0.5 m-0">
                    Monitors multi-decadal changes in the global ocean freshwater budget and sea ice melting.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}