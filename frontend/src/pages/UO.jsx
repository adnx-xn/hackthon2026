import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function UO({ onNavigate }) {
  const mountRef = useRef(null);
  const [selectedLayer, setSelectedLayer] = useState('all'); // 'all', 'surface', 'mid', 'deep'
  const [flowSpeed, setFlowSpeed] = useState(1.0);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectiveFlowSpeed = prefersReducedMotion ? 0.2 : flowSpeed;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020817, 0.023);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    camera.position.set(0, 11, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Volumetric Depth Level Reference Planes
    // Coordinate layout:
    // X: West (-14) to East (+14) -> Flow moves towards +X (Eastward)
    // Y: Depth (+3.0 Surface to -4.5 Abyssal)
    // Z: South (+12) to North (-12), Equator at Z = 0
    const gridGroup = new THREE.Group();

    const depthLevels = [
      { y: 2.5, color: 0x0ea5e9, op: 0.2 },
      { y: 0.0, color: 0x06b6d4, op: 0.12 },
      { y: -3.2, color: 0x6366f1, op: 0.08 },
    ];

    depthLevels.forEach((lvl) => {
      const planeGeo = new THREE.PlaneGeometry(28, 24, 14, 12);
      planeGeo.rotateX(-Math.PI / 2);
      const wireframe = new THREE.WireframeGeometry(planeGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: lvl.color,
        transparent: true,
        opacity: lvl.op,
      });
      const gridMesh = new THREE.LineSegments(wireframe, lineMat);
      gridMesh.position.y = lvl.y;
      gridGroup.add(gridMesh);
    });
    scene.add(gridGroup);

    // 3. Volumetric Flow Particles (Surface, Mid-Depth, Deep)
    // Strong Eastward (+X) momentum, simulating the equatorial Wyrtki Jet
    const particleCount = 4200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleData = [];

    // Particle Glow Texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pctx = pCanvas.getContext('2d');
    const grad = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.95)');
    grad.addColorStop(0.7, 'rgba(99, 102, 241, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 32, 32);
    const pTex = new THREE.CanvasTexture(pCanvas);

    for (let i = 0; i < particleCount; i++) {
      const rand = Math.random();
      let layerType = 'surface';
      let y = 1.6 + Math.random() * 1.4;
      let speedX = 0.08 + Math.random() * 0.12;
      let z = -10 + Math.random() * 20;
      let cr = 0.9, cg = 0.98, cb = 1.0;

      if (rand < 0.5) {
        // SURFACE FLOW: Fast Wyrtki Jet along equatorial band (z: -4 to +4)
        layerType = 'surface';
        y = 1.6 + Math.random() * 1.4;
        const inEquatorialJet = Math.random() < 0.6;
        if (inEquatorialJet) {
          z = -3.5 + Math.random() * 7.0; // Concentrated along equator
          speedX = 0.14 + Math.random() * 0.12; // High eastward velocity > 1.5 m/s
          cr = 1.0; cg = 1.0; cb = 1.0; // Luminous White/Electric Cyan
        } else {
          // Off-equator surface flow (some westward South Equatorial Current at z < -5)
          const isSouthCurrent = z < -5;
          speedX = isSouthCurrent ? -0.05 - Math.random() * 0.04 : 0.06 + Math.random() * 0.05;
          cr = 0.15; cg = 0.8; cb = 0.98; // Cyan
        }
      } else if (rand < 0.85) {
        // MID-DEPTH FLOW: Slower cyan particles, meandering eddies
        layerType = 'mid';
        y = -0.8 + Math.random() * 1.8;
        speedX = 0.03 + Math.random() * 0.05;
        cr = 0.06; cg = 0.65; cb = 0.88; // Deep Cyan
      } else {
        // DEEP OCEAN: Equatorial Undercurrent (EUC) counter-flow drifting westward (-X)
        layerType = 'deep';
        y = -3.4 + Math.random() * 1.8;
        speedX = -0.02 - Math.random() * 0.03; // Westward undercurrent
        cr = 0.45; cg = 0.35; cb = 0.9; // Purple / Deep Indigo
      }

      const x = -14 + Math.random() * 28;

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3 + 0] = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;

      particleData.push({
        layerType,
        baseY: y,
        speedX,
        eddyPhase: Math.random() * Math.PI * 2,
        eddySpeed: (Math.random() - 0.5) * 0.02,
        baseColor: [cr, cg, cb],
      });
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.52,
      map: pTex,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 4. Eastward Streamline Ribbons (Wyrtki Jet Trajectories)
    const streamlineCount = 36;
    const streamlineGroup = new THREE.Group();
    const streamlineData = [];

    for (let s = 0; s < streamlineCount; s++) {
      const isEquatorialCore = s < 20;
      const baseZ = isEquatorialCore ? -3.0 + (s % 8) * 0.85 : -9 + Math.random() * 18;
      const baseY = isEquatorialCore ? 2.1 + Math.random() * 0.6 : 1.2 + Math.random() * 1.0;
      const points = [];
      const segmentCount = 28;

      for (let j = 0; j < segmentCount; j++) {
        const px = -14 + (j / (segmentCount - 1)) * 28; // West (-14) to East (+14)
        // Gentle wave oscillation along jet corridor
        const jetOscillation = isEquatorialCore
          ? Math.sin(px * 0.25 + s) * 0.9 + Math.cos(px * 0.15) * 0.4
          : Math.sin(px * 0.35 + s) * 1.8;
        const py = baseY + Math.sin(px * 0.3) * 0.25;
        points.push(new THREE.Vector3(px, py, baseZ + jetOscillation));
      }

      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: isEquatorialCore ? 0xf0f9ff : 0x0ea5e9,
        transparent: true,
        opacity: isEquatorialCore ? 0.65 : 0.3,
        blending: THREE.AdditiveBlending,
      });

      const line = new THREE.Line(curveGeo, lineMat);
      streamlineGroup.add(line);
      streamlineData.push({ line, isEquatorialCore });
    }
    scene.add(streamlineGroup);

    // 5. Directional Arrow HUD Indicator in 3D Scene
    const arrowDir = new THREE.Vector3(1, 0, 0); // Eastward (+X)
    const arrowOrigin = new THREE.Vector3(-8, 2.6, 9.5);
    const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowOrigin, 4.2, 0x38bdf8, 1.2, 0.8);
    scene.add(arrowHelper);

    // 6. Interactive Mouse Orbit & Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
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
        targetRotY += deltaX * 0.005;
        targetRotX += deltaY * 0.003;
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

    // 7. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime() * effectiveFlowSpeed;

      // Update Particle Positions (Streaming Eastward towards +X)
      const posArr = particleGeo.attributes.position.array;
      const colArr = particleGeo.attributes.color.array;

      for (let i = 0; i < particleCount; i++) {
        const pData = particleData[i];

        // Layer Filter
        const isVisible =
          selectedLayer === 'all' || pData.layerType === selectedLayer;

        if (!isVisible) {
          colArr[i * 3 + 0] = 0;
          colArr[i * 3 + 1] = 0;
          colArr[i * 3 + 2] = 0;
          continue;
        } else {
          colArr[i * 3 + 0] = pData.baseColor[0];
          colArr[i * 3 + 1] = pData.baseColor[1];
          colArr[i * 3 + 2] = pData.baseColor[2];
        }

        // Advance along X (Eastward: +X)
        posArr[i * 3 + 0] += pData.speedX * (delta * 60) * effectiveFlowSpeed;

        // Subtle meander along Z
        pData.eddyPhase += pData.eddySpeed * effectiveFlowSpeed;
        posArr[i * 3 + 2] += Math.sin(pData.eddyPhase) * 0.02 * effectiveFlowSpeed;

        // Wrap around boundary to create seamless infinite loop
        if (pData.speedX > 0 && posArr[i * 3 + 0] > 14.5) {
          posArr[i * 3 + 0] = -14.5;
          posArr[i * 3 + 2] = -10 + Math.random() * 20;
        } else if (pData.speedX < 0 && posArr[i * 3 + 0] < -14.5) {
          posArr[i * 3 + 0] = 14.5;
          posArr[i * 3 + 2] = -10 + Math.random() * 20;
        }
      }

      particleGeo.attributes.position.needsUpdate = true;
      particleGeo.attributes.color.needsUpdate = true;

      // Pulse Streamlines
      streamlineGroup.children.forEach((line, idx) => {
        const sData = streamlineData[idx];
        const pulse = (Math.sin(time * 3 + idx * 0.5) + 1) * 0.5;
        line.material.opacity = sData.isEquatorialCore
          ? 0.45 + pulse * 0.4
          : 0.2 + pulse * 0.25;
      });

      // Camera & Orbit Rotation
      if (isRotating && !isDragging) {
        targetRotY += 0.0008;
      }

      particleSystem.rotation.y += (targetRotY - particleSystem.rotation.y) * 0.05;
      particleSystem.rotation.x += (targetRotX - particleSystem.rotation.x) * 0.05;
      gridGroup.rotation.y = particleSystem.rotation.y;
      gridGroup.rotation.x = particleSystem.rotation.x;
      streamlineGroup.rotation.y = particleSystem.rotation.y;
      streamlineGroup.rotation.x = particleSystem.rotation.x;
      arrowHelper.rotation.y = particleSystem.rotation.y;

      camera.position.x += (mouseX * 3.0 - camera.position.x) * 0.03;
      camera.position.y += (11 + mouseY * 2.0 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);

      particleGeo.dispose();
      particleMat.dispose();
      pTex.dispose();
      streamlineGroup.children.forEach((c) => {
        c.geometry.dispose();
        c.material.dispose();
      });
      gridGroup.children.forEach((g) => {
        g.geometry.dispose();
        g.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [flowSpeed, selectedLayer, isRotating]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#020817] text-white font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif] selection:bg-cyan-500/30 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-[20%] w-[800px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[160px]" />
        <div className="absolute top-1/3 right-[-80px] w-[700px] h-[700px] rounded-full bg-indigo-600/[0.05] blur-[180px]" />
        <div className="absolute bottom-[-100px] left-1/3 w-[900px] h-[500px] rounded-full bg-[#031426] blur-[150px]" />
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-[1580px] mx-auto px-5 sm:px-8 lg:px-12 pt-6 pb-16">
        
        {/* =========================================================================
            HERO SECTION — 3D Volumetric Flow & Scientific Context
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.55fr] gap-8 items-start mb-8">
          
          {/* LEFT: Typography & Quick Scientific Context */}
          <div className="flex flex-col justify-start pt-2">
            {/* Tag / Icon */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-[46px] h-[46px] rounded-full border border-cyan-400/60 bg-cyan-500/10 flex items-center justify-center text-[22px] shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                ↔️
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
                  Ocean Velocity Component
                </span>
                <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-tight text-white m-0">
                  UO
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            <h2 className="text-[17px] sm:text-[19px] font-medium text-cyan-100/90 mb-3 tracking-tight">
              Eastward Ocean Velocity
            </h2>

            {/* Short Explanatory Text */}
            <p className="text-[13.5px] sm:text-[14px] leading-[1.65] text-slate-300 mb-5 max-w-[530px]">
              UO describes the eastward component of seawater motion. It helps visualize how currents transport water horizontally across ocean basins.
            </p>

            {/* Volumetric Depth Layer Filter */}
            <div className="p-3 rounded-xl bg-[#031426]/75 border border-cyan-500/20 backdrop-blur-md mb-6">
              <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>VOLUMETRIC DEPTH LAYERS</span>
                <span className="text-cyan-400 font-mono text-[10px]">3D COLUMN</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All Depths', desc: '0–1000m' },
                  { id: 'surface', label: 'Surface', desc: '0–100m' },
                  { id: 'mid', label: 'Mid-Water', desc: '100–500m' },
                  { id: 'deep', label: 'Deep Abyssal', desc: '500–1000m' },
                ].map((lyr) => (
                  <button
                    key={lyr.id}
                    onClick={() => setSelectedLayer(lyr.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                      selectedLayer === lyr.id
                        ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                        : 'bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[11.5px] font-semibold">{lyr.label}</div>
                    <div className="text-[9.5px] text-slate-400">{lyr.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls & CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate && onNavigate('visualization')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[13px] font-semibold tracking-wide shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Explore Velocity Field</span>
                <span className="text-[15px]">→</span>
              </button>

              <button
                onClick={() => setIsRotating(!isRotating)}
                className={`px-3.5 py-2.5 rounded-full text-[12px] font-medium transition-all cursor-pointer ${
                  isRotating
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {isRotating ? '⏸ Pause Orbit' : '▶ Auto Orbit'}
              </button>

              <div className="flex items-center gap-1 bg-[#031426]/75 border border-cyan-500/20 rounded-full px-2 py-1">
                {[0.5, 1.0, 1.8].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setFlowSpeed(spd)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-all cursor-pointer ${
                      flowSpeed === spd
                        ? 'bg-cyan-400 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: 3D Volumetric Flow Visualization */}
          <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] rounded-2xl overflow-hidden border border-cyan-500/25 bg-gradient-to-b from-[#020914] to-[#01050e] shadow-[0_0_40px_rgba(8,145,178,0.15)] group">
            {/* 3D WebGL Canvas */}
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Top Overlay Badge */}
            <div className="absolute top-4 left-4 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#020713]/80 border border-cyan-400/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-cyan-200">
                VOLUMETRIC EASTWARD VECTOR FIELD (UO)
              </span>
            </div>

            {/* Interaction Hint */}
            <div className="absolute top-4 right-4 pointer-events-none hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#020713]/60 border border-slate-700/40 backdrop-blur-sm text-[10px] text-slate-400">
              <span>🖱 Drag to Orbit · Scroll to Zoom</span>
            </div>

            {/* Floating Directional Velocity Legend */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-[390px] p-3.5 rounded-xl bg-[#031426]/85 border border-cyan-500/30 backdrop-blur-md shadow-xl pointer-events-auto">
              <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-100 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  EASTWARD VELOCITY (UO)
                </span>
                <span className="font-mono text-slate-400 text-[10px]">m/s</span>
              </div>

              {/* Divergent Colormap */}
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#312e81] via-[#1e40af] via-[#334155] via-[#0ea5e9] to-[#ffffff] shadow-inner mb-1.5" />

              {/* Directional Ticks */}
              <div className="flex justify-between text-[10px] font-mono text-slate-300">
                <span>← Westward (-1.2)</span>
                <span>0 (Neutral)</span>
                <span>→ Eastward (+1.5)</span>
              </div>

              {/* Legend Summary */}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-slate-400">
                <span className="text-indigo-400 font-medium">Negative = Westward Flow</span>
                <span className="text-cyan-300 font-medium">Positive = Eastward Jet</span>
              </div>
            </div>

            {/* Current Jet Callout Badge */}
            <div className="absolute bottom-4 right-4 hidden md:flex flex-col gap-1.5 pointer-events-none">
              <div className="px-2.5 py-1 rounded bg-[#020713]/80 border border-cyan-400/30 backdrop-blur-sm text-[10px] text-cyan-200">
                <strong>Wyrtki Jet Core:</strong> Eastward Equatorial Jet (&gt;1.5 m/s)
              </div>
              <div className="px-2.5 py-1 rounded bg-[#020713]/80 border border-indigo-500/30 backdrop-blur-sm text-[10px] text-indigo-200">
                <strong>Equatorial Undercurrent:</strong> Westward Abyssal Flow
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            SUPPORTING SCIENTIFIC CONTENT CARDS
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* Card 1: WHAT IT SHOWS */}
          <div className="p-5 rounded-xl bg-[#031426]/60 border border-cyan-500/20 backdrop-blur-md shadow-md">
            <div className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 mb-1">
              Primary Metric
            </div>
            <h3 className="text-[15px] font-bold text-white mb-2">
              What It Shows
            </h3>
            <p className="text-[12.5px] leading-relaxed text-slate-300 m-0">
              Eastward movement of seawater across ocean basins, zonal current systems, and equatorial corridors.
            </p>
          </div>

          {/* Card 2: UNIT */}
          <div className="p-5 rounded-xl bg-[#031426]/60 border border-cyan-500/20 backdrop-blur-md shadow-md">
            <div className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 mb-1">
              Scientific Measurement
            </div>
            <h3 className="text-[15px] font-bold text-white mb-2">
              Unit
            </h3>
            <p className="text-[12.5px] leading-relaxed text-slate-300 m-0">
              <strong className="text-cyan-300 font-mono">m/s</strong> (metres per second), indicating directional speed along lines of latitude.
            </p>
          </div>

          {/* Card 3: WHY IT MATTERS */}
          <div className="p-5 rounded-xl bg-[#031426]/60 border border-cyan-500/20 backdrop-blur-md shadow-md">
            <div className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 mb-1">
              Oceanographic Impact
            </div>
            <h3 className="text-[15px] font-bold text-white mb-2">
              Why It Matters
            </h3>
            <p className="text-[12.5px] leading-relaxed text-slate-300 m-0">
              Helps reveal current pathways, equatorial Wyrtki Jet pulses, heat redistribution, and horizontal transport.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
