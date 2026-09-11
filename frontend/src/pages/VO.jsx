import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function VO({ onNavigate }) {
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
    scene.fog = new THREE.FogExp2(0x020713, 0.024);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      120
    );
    camera.position.set(0, 11, 20);
    camera.lookAt(0, 0, 1);

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

    // 2. Volumetric Depth Bounding Grids & Planes
    // Coordinate layout:
    // X: West (-14) to East (+14)
    // Y: Depth (+3.0 Surface to -4.5 Abyssal)
    // Z: South (+14) to North (-14) -> Flow moves towards -Z (Northward)
    const gridGroup = new THREE.Group();

    // Depth Level Lines (Surface: Y=2.5, Thermocline: Y=0.0, Abyssal: Y=-3.5)
    const depthLevels = [
      { y: 2.5, label: 'Surface (0 m)', color: 0x22d3ee, op: 0.2 },
      { y: 0.0, label: 'Mid-Water (200 m)', color: 0x0ea5e9, op: 0.12 },
      { y: -3.2, label: 'Deep Ocean (1000 m)', color: 0x1e3a8a, op: 0.08 },
    ];

    depthLevels.forEach((lvl) => {
      const planeGeo = new THREE.PlaneGeometry(28, 28, 14, 14);
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

    // 3. Volumetric Flow Particles (3 Layers: Surface, Mid-Depth, Deep)
    // High particle count with strong Northward (+Z to -Z) directional momentum
    const particleCount = 4200;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleData = [];

    // Particle Texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pctx = pCanvas.getContext('2d');
    const grad = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(34, 211, 238, 0.9)');
    grad.addColorStop(0.7, 'rgba(14, 165, 233, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 32, 32);
    const pTex = new THREE.CanvasTexture(pCanvas);

    for (let i = 0; i < particleCount; i++) {
      // Determine Layer: 50% Surface, 35% Mid, 15% Deep
      const rand = Math.random();
      let layerType = 'surface';
      let y = 1.5 + Math.random() * 1.5;
      let speedZ = 0.06 + Math.random() * 0.09; // Fast Northward
      let cr = 0.9, cg = 0.98, cb = 1.0; // White / Bright Cyan

      let x = -13 + Math.random() * 26;
      const z = -13 + Math.random() * 26;

      if (rand < 0.5) {
        // SURFACE FLOW: Fast, intense northward Somali Jet along Western boundary (x: -12 to -3)
        layerType = 'surface';
        y = 1.6 + Math.random() * 1.4;
        const inSomaliJet = Math.random() < 0.45;
        if (inSomaliJet) {
          x = -11 + Math.random() * 6; // Concentrated boundary current
          speedZ = 0.12 + Math.random() * 0.12; // High velocity > 1.8 m/s
          cr = 1.0; cg = 1.0; cb = 1.0; // Glowing White Jet Core
        } else {
          speedZ = 0.05 + Math.random() * 0.07;
          cr = 0.2; cg = 0.85; cb = 0.95; // Cyan
        }
      } else if (rand < 0.85) {
        // MID-WATER FLOW: Slower, meandering eddies
        layerType = 'mid';
        y = -0.8 + Math.random() * 1.8;
        speedZ = 0.03 + Math.random() * 0.04;
        cr = 0.08; cg = 0.65; cb = 0.82; // Teal / Blue
      } else {
        // DEEP FLOW: Darker, subtle deep counter-drift (some drifting south!)
        layerType = 'deep';
        y = -3.4 + Math.random() * 1.8;
        speedZ = -0.015 - Math.random() * 0.025; // Southward deep return undercurrent
        cr = 0.12; cg = 0.25; cb = 0.72; // Deep Indigo
      }

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3 + 0] = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;

      particleData.push({
        layerType,
        baseY: y,
        speedZ,
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

    // 4. Northward Streamline Curves (Dynamic Glowing Jet Trajectories)
    const streamlineCount = 36;
    const streamlineGroup = new THREE.Group();
    const streamlineData = [];

    for (let s = 0; s < streamlineCount; s++) {
      const isWesternJet = s < 18;
      const baseX = isWesternJet ? -9.5 + (s % 6) * 1.2 : -3 + Math.random() * 14;
      const baseY = isWesternJet ? 2.0 + Math.random() * 0.6 : 1.2 + Math.random() * 1.0;
      const points = [];
      const segmentCount = 28;

      for (let j = 0; j < segmentCount; j++) {
        const pz = 13 - (j / (segmentCount - 1)) * 26; // South (+13) to North (-13)
        // Add cyclonic eddy curvature along trajectory
        const eddyBend = isWesternJet
          ? Math.sin(pz * 0.25 + s) * 1.4 + Math.cos(pz * 0.15) * 0.8
          : Math.sin(pz * 0.3 + s) * 2.2;
        const py = baseY + Math.sin(pz * 0.4) * 0.3;
        points.push(new THREE.Vector3(baseX + eddyBend, py, pz));
      }

      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: isWesternJet ? 0xe0f2fe : 0x06b6d4,
        transparent: true,
        opacity: isWesternJet ? 0.65 : 0.35,
        blending: THREE.AdditiveBlending,
      });

      const line = new THREE.Line(curveGeo, lineMat);
      streamlineGroup.add(line);
      streamlineData.push({ line, baseX, isWesternJet });
    }
    scene.add(streamlineGroup);

    // 5. Directional Arrow HUD Indicator in 3D Scene
    const arrowDir = new THREE.Vector3(0, 0, -1); // Northward
    const arrowOrigin = new THREE.Vector3(10.5, 2.6, 6);
    const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowOrigin, 4.2, 0x22d3ee, 1.2, 0.8);
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

      // Update Particle Positions (Streaming Northward towards -Z)
      const posArr = particleGeo.attributes.position.array;
      const colArr = particleGeo.attributes.color.array;

      for (let i = 0; i < particleCount; i++) {
        const pData = particleData[i];

        // Layer Filter check
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

        // Advance along Z (Northward: -Z)
        posArr[i * 3 + 2] -= pData.speedZ * (delta * 60) * effectiveFlowSpeed;

        // Meandering / Eddy swirl component along X
        pData.eddyPhase += pData.eddySpeed * effectiveFlowSpeed;
        posArr[i * 3 + 0] += Math.sin(pData.eddyPhase) * 0.02 * effectiveFlowSpeed;

        // Wrap around boundary to create seamless infinite flow
        if (pData.speedZ > 0 && posArr[i * 3 + 2] < -13.5) {
          posArr[i * 3 + 2] = 13.5;
          posArr[i * 3 + 0] = -13 + Math.random() * 26;
        } else if (pData.speedZ < 0 && posArr[i * 3 + 2] > 13.5) {
          posArr[i * 3 + 2] = -13.5;
          posArr[i * 3 + 0] = -13 + Math.random() * 26;
        }
      }

      particleGeo.attributes.position.needsUpdate = true;
      particleGeo.attributes.color.needsUpdate = true;

      // Pulse Streamlines
      streamlineGroup.children.forEach((line, idx) => {
        const sData = streamlineData[idx];
        const pulse = (Math.sin(time * 3 + idx * 0.5) + 1) * 0.5;
        line.material.opacity = sData.isWesternJet
          ? 0.45 + pulse * 0.4
          : 0.2 + pulse * 0.25;
      });

      // Camera & Parallax Control
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
      camera.lookAt(0, 0, 1);

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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#020713] text-white font-['Inter','Segoe_UI',system-ui,-apple-system,sans-serif] selection:bg-cyan-500/30 selection:text-white">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-[15%] w-[800px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[160px]" />
        <div className="absolute top-1/3 right-[-100px] w-[700px] h-[700px] rounded-full bg-blue-600/[0.05] blur-[180px]" />
        <div className="absolute bottom-[-100px] left-1/4 w-[900px] h-[500px] rounded-full bg-[#031426] blur-[150px]" />
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
                🧭
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
                  Ocean Velocity Component
                </span>
                <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-tight text-white m-0">
                  VO
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            <h2 className="text-[17px] sm:text-[19px] font-medium text-cyan-100/90 mb-3 tracking-tight">
              Northward Ocean Velocity
            </h2>

            {/* Short Explanatory Text */}
            <p className="text-[13.5px] sm:text-[14px] leading-[1.65] text-slate-300 mb-5 max-w-[530px]">
              VO describes the northward component of seawater motion. Visualizing it helps reveal the direction and strength of ocean transport across the water column.
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
                VOLUMETRIC NORTHWARD VECTOR FIELD (VO)
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
                  NORTHWARD VELOCITY (VO)
                </span>
                <span className="font-mono text-slate-400 text-[10px]">m/s</span>
              </div>

              {/* Divergent Colormap */}
              <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-[#1e40af] via-[#0284c7] via-[#334155] via-[#22d3ee] to-[#ffffff] shadow-inner mb-1.5" />

              {/* Directional Ticks */}
              <div className="flex justify-between text-[10px] font-mono text-slate-300">
                <span>← Southward (-1.5)</span>
                <span>0 (Neutral)</span>
                <span>→ Northward (+2.0)</span>
              </div>

              {/* Legend Summary */}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50 text-[10px] text-slate-400">
                <span className="text-blue-400 font-medium">Negative = Southward Flow</span>
                <span className="text-cyan-300 font-medium">Positive = Northward Jet</span>
              </div>
            </div>

            {/* Current Jet Callout Badge */}
            <div className="absolute bottom-4 right-4 hidden md:flex flex-col gap-1.5 pointer-events-none">
              <div className="px-2.5 py-1 rounded bg-[#020713]/80 border border-cyan-400/30 backdrop-blur-sm text-[10px] text-cyan-200">
                <strong>Somali Current Jet:</strong> Cross-Equatorial Surge (&gt;2.0 m/s)
              </div>
              <div className="px-2.5 py-1 rounded bg-[#020713]/80 border border-slate-700/40 backdrop-blur-sm text-[10px] text-slate-300">
                <strong>Abyssal Layer:</strong> Weak Southward Return Drift
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
              Northward movement of seawater across ocean basins, boundary currents, and equatorial transitions.
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
              <strong className="text-cyan-300 font-mono">m/s</strong> (metres per second), indicating directional speed along lines of longitude.
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
              Helps understand ocean circulation, monsoon current reversals, heat transport, and upwelling zones.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
