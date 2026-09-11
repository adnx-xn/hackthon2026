import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * AboutOceanBackground
 * 
 * Cinematic 3D interactive ocean visualization background for the About page.
 * Narrative progression across scroll:
 *   0.00 – 0.25: SPACE & EARTH (Floating 3D globe, dark space, subtle stars, atmospheric glow)
 *   0.25 – 0.50: INDIAN OCEAN FOCUS & FLUID DEFORMATION (Focuses on Indian Ocean, currents, lower hemisphere stretching)
 *   0.50 – 0.70: LIQUID EARTH (Planetary form transitions into luminous ocean fluid, continents distort, droplets form)
 *   0.70 – 0.85: FALLING WATER (Water stretches downward into cascading streams, droplets, splashes)
 *   0.85 – 1.00: 3D OCEAN WAVES (Expansive rolling ocean surface, specular reflections, foam, continuous motion)
 */
export default function AboutOceanBackground({ scrollProgressRef }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || (window.innerHeight - 68);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.5, 9.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const sunDir = new THREE.Vector3(3.5, 2.0, 4.0).normalize();

    // --- 1. Starfield Background ---
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    const starTwinkles = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const radius = 60 + Math.random() * 80;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 10; // keep mostly behind
      starTwinkles[i] = Math.random() * Math.PI * 2;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('aTwinkle', new THREE.BufferAttribute(starTwinkles, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aTwinkle;
        varying float vAlpha;
        void main() {
          vAlpha = 0.35 + 0.45 * sin(uTime * 2.0 + aTwinkle);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (1.5 + 1.2 * sin(uTime * 1.5 + aTwinkle)) * (100.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float strength = pow(1.0 - (dist * 2.0), 1.8);
          gl_FragColor = vec4(0.85, 0.94, 1.0, strength * vAlpha * 0.7);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // --- 2. Procedural Fallback + Loaded Earth Texture ---
    function createProceduralEarthTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      // Deep ocean gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#041738');
      grad.addColorStop(0.5, '#021029');
      grad.addColorStop(1, '#020b1c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Continents approximation silhouettes
      ctx.fillStyle = '#1c3d2e';
      // Africa & Eurasia
      ctx.beginPath();
      ctx.ellipse(560, 240, 120, 150, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Indian Subcontinent
      ctx.fillStyle = '#264e3c';
      ctx.beginPath();
      ctx.moveTo(690, 180);
      ctx.lineTo(740, 180);
      ctx.lineTo(715, 270);
      ctx.closePath();
      ctx.fill();
      // Americas
      ctx.fillStyle = '#1e382b';
      ctx.beginPath();
      ctx.ellipse(260, 260, 80, 180, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Australia
      ctx.beginPath();
      ctx.ellipse(840, 360, 50, 40, 0, 0, Math.PI * 2);
      ctx.fill();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }

    const earthTexture = createProceduralEarthTexture();
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/assets/earth/earth_atmos_2048.jpg',
      (loadedTex) => {
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.ClampToEdgeWrapping;
        earthMaterial.uniforms.uEarthMap.value = loadedTex;
        earthMaterial.uniforms.uEarthMap.value.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback to daymap if atmos image fails
        textureLoader.load('/assets/earth/8k_earth_daymap.jpg', (fallbackTex) => {
          fallbackTex.wrapS = THREE.RepeatWrapping;
          fallbackTex.wrapT = THREE.ClampToEdgeWrapping;
          earthMaterial.uniforms.uEarthMap.value = fallbackTex;
          earthMaterial.uniforms.uEarthMap.value.needsUpdate = true;
        });
      }
    );

    // --- 3. Morphing Earth & Liquid Shader ---
    const earthRadius = 3.2;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 96, 96);

    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uEarthMap: { value: earthTexture },
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uSunDir: { value: sunDir },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPos;
        varying float vLiquidFactor;
        varying float vDisp;

        // Wave perturbation function
        float getWave(vec3 p, float t) {
          float w = sin(p.x * 2.2 + t * 2.1) * cos(p.z * 2.2 + t * 1.8);
          w += sin(p.y * 3.6 - t * 2.5 + p.x * 1.6) * 0.45;
          w += cos(p.z * 4.6 + t * 3.1) * 0.22;
          return w;
        }

        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Timeline milestones:
          // 0.22 - 0.48: Rotation & Initial stretching
          // 0.48 - 0.70: Major fluid deformation & strand elongation
          // 0.70 - 0.86: Dissolution into downward cascade
          float deformStart = smoothstep(0.22, 0.50, uProgress);
          float liquidStart = smoothstep(0.48, 0.70, uProgress);
          float dissolveStart = smoothstep(0.70, 0.86, uProgress);
          
          vLiquidFactor = clamp(deformStart * 0.6 + liquidStart * 0.7, 0.0, 1.0);
          
          float wave = getWave(pos, uTime * 1.3);
          vDisp = wave;

          // Downward liquid elongation on lower hemisphere (y < 0.6)
          float stretchMask = smoothstep(1.0, -2.8, pos.y);
          float stretchY = deformStart * stretchMask * 2.1 + liquidStart * stretchMask * 4.2;
          pos.y -= stretchY;

          // Liquid taper & strand narrowing as it pulls downwards
          float taper = 1.0 - (stretchY * 0.11 * smoothstep(0.2, -5.5, pos.y));
          pos.x *= max(taper, 0.2);
          pos.z *= max(taper, 0.2);

          // Fluid surface wobble
          pos += normal * (wave * (deformStart * 0.16 + liquidStart * 0.38));

          // In late stage, plunge downward and dissipate into falling stream
          pos.y -= dissolveStart * 8.5;
          pos *= (1.0 - dissolveStart * 0.55);

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;
          vPosition = pos;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uEarthMap;
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uSunDir;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPos;
        varying float vLiquidFactor;
        varying float vDisp;

        void main() {
          // Distort continent UVs during liquid transition
          vec2 uvDist = vUv;
          float distort = vLiquidFactor * 0.065;
          uvDist.x += sin(vPosition.y * 4.5 + uTime * 2.2) * distort;
          uvDist.y += cos(vPosition.x * 4.5 + uTime * 2.0) * distort;
          
          vec4 texColor = texture2D(uEarthMap, uvDist);

          // Atmospheric Fresnel rim
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
          fresnel = pow(fresnel, 2.6);

          // Sun directional lighting
          vec3 lightDir = normalize(uSunDir);
          float diff = max(dot(vNormal, lightDir), 0.0);
          float ambient = 0.25;
          float lighting = ambient + diff * 0.85;

          // Base Earth rendering
          vec3 earthCol = texColor.rgb * lighting;
          // Atmosphere rim
          earthCol += vec3(0.12, 0.58, 0.98) * fresnel * (1.0 - vLiquidFactor * 0.8);

          // Deep ocean liquid material
          vec3 deepAbyss = vec3(0.01, 0.07, 0.22);
          vec3 oceanAqua = vec3(0.04, 0.44, 0.72);
          vec3 specularCyan = vec3(0.25, 0.88, 1.0);

          vec3 halfDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(vNormal, halfDir), 0.0), 32.0);
          vec3 liquidCol = mix(deepAbyss, oceanAqua, vDisp * 0.5 + 0.5);
          liquidCol += specularCyan * spec * 1.35;
          liquidCol += vec3(0.1, 0.55, 0.95) * fresnel * 0.7;

          // Seamless transition between Earth and liquid
          vec3 finalColor = mix(earthCol, liquidCol, vLiquidFactor);

          // Fade out smoothly in stage 4 (0.70 to 0.86) as falling water merges with ocean
          float alpha = 1.0 - smoothstep(0.72, 0.86, uProgress);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: true,
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMaterial);
    scene.add(earthMesh);

    // --- 4. Atmospheric Glow Outer Shell ---
    const atmosGeo = new THREE.SphereGeometry(earthRadius * 1.035, 64, 64);
    const atmosMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0 },
        uSunDir: { value: sunDir },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform vec3 uSunDir;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
          fresnel = pow(fresnel, 3.2);

          vec3 lightDir = normalize(uSunDir);
          float sunSide = max(dot(vNormal, lightDir), -0.2) + 0.2;

          vec3 glowColor = vec3(0.2, 0.65, 1.0) * fresnel * sunSide * 1.2;
          float fade = 1.0 - smoothstep(0.28, 0.55, uProgress);
          gl_FragColor = vec4(glowColor, fresnel * 0.85 * fade);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMaterial);
    earthMesh.add(atmosMesh);

    // --- 5. Indian Ocean Current Streamlines & Flow Particles ---
    // Accurate geodetic coordinates to spherical (lon, lat) around Indian Ocean
    function geoToVector(lonDeg, latDeg, r) {
      const phi = (90 - latDeg) * (Math.PI / 180);
      const theta = (lonDeg + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }

    const currentPaths = [
      // Equatorial Jet
      [ { lon: 55, lat: 0 }, { lon: 70, lat: 2 }, { lon: 85, lat: 0 }, { lon: 98, lat: -2 } ],
      // Somali Current to Arabian Sea
      [ { lon: 48, lat: -4 }, { lon: 52, lat: 6 }, { lon: 58, lat: 14 }, { lon: 68, lat: 18 }, { lon: 74, lat: 15 } ],
      // Bay of Bengal Gyre
      [ { lon: 80, lat: 8 }, { lon: 84, lat: 14 }, { lon: 88, lat: 18 }, { lon: 92, lat: 12 }, { lon: 85, lat: 6 } ],
      // South Equatorial Current
      [ { lon: 95, lat: -12 }, { lon: 78, lat: -11 }, { lon: 60, lat: -13 }, { lon: 48, lat: -15 } ],
    ];

    const currentGroup = new THREE.Group();
    earthMesh.add(currentGroup);

    const currentMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aOffset;
        varying float vAlpha;
        void main() {
          vAlpha = sin(uTime * 3.5 + aOffset) * 0.5 + 0.5;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (2.2 + 1.2 * vAlpha) * (80.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          // Active primarily between 0.18 and 0.55
          float active = smoothstep(0.16, 0.32, uProgress) * (1.0 - smoothstep(0.48, 0.65, uProgress));
          vec3 col = mix(vec3(0.2, 0.75, 1.0), vec3(0.5, 0.95, 1.0), vAlpha);
          gl_FragColor = vec4(col, (1.0 - dist * 2.0) * vAlpha * active * 0.9);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const flowPointsCount = 450;
    const flowPositions = new Float32Array(flowPointsCount * 3);
    const flowOffsets = new Float32Array(flowPointsCount);

    let ptIdx = 0;
    currentPaths.forEach((path) => {
      const curvePoints = path.map(p => geoToVector(p.lon, p.lat, earthRadius * 1.015));
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const samples = 110;
      for (let s = 0; s < samples && ptIdx < flowPointsCount; s++) {
        const pt = curve.getPoint(s / samples);
        flowPositions[ptIdx * 3] = pt.x;
        flowPositions[ptIdx * 3 + 1] = pt.y;
        flowPositions[ptIdx * 3 + 2] = pt.z;
        flowOffsets[ptIdx] = (s / samples) * Math.PI * 4;
        ptIdx++;
      }
    });

    const flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
    flowGeo.setAttribute('aOffset', new THREE.BufferAttribute(flowOffsets, 1));
    const flowPoints = new THREE.Points(flowGeo, currentMaterial);
    currentGroup.add(flowPoints);

    // --- 6. Falling Water Streams & Droplet Particles (Stages 3 & 4: 0.50 – 0.85) ---
    const dropletCount = 550;
    const dropletPositions = new Float32Array(dropletCount * 3);
    const dropletSeeds = new Float32Array(dropletCount * 4); // x-speed, y-speed, phase, size

    for (let i = 0; i < dropletCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.8;
      dropletPositions[i * 3] = Math.cos(angle) * radius;
      dropletPositions[i * 3 + 1] = -0.5 - Math.random() * 9.0;
      dropletPositions[i * 3 + 2] = Math.sin(angle) * radius;

      dropletSeeds[i * 4] = (Math.random() - 0.5) * 0.4; // drift X
      dropletSeeds[i * 4 + 1] = 2.5 + Math.random() * 4.0; // fall velocity
      dropletSeeds[i * 4 + 2] = Math.random() * Math.PI * 2; // phase
      dropletSeeds[i * 4 + 3] = 1.5 + Math.random() * 2.8; // scale
    }

    const dropletGeo = new THREE.BufferGeometry();
    dropletGeo.setAttribute('position', new THREE.BufferAttribute(dropletPositions, 3));
    dropletGeo.setAttribute('aSeed', new THREE.BufferAttribute(dropletSeeds, 4));

    const dropletMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        attribute vec4 aSeed;
        varying float vAlpha;
        varying float vDropletY;

        void main() {
          vec3 pos = position;
          float speed = aSeed.y;
          float phase = aSeed.z;
          float size = aSeed.w;

          // Falling motion: dynamic cycling
          float fallProgress = smoothstep(0.48, 0.85, uProgress);
          float fallDistance = 11.0;
          float currentY = pos.y - mod(uTime * speed * (0.8 + fallProgress * 1.5) + phase, fallDistance);
          pos.y = currentY;

          // Radial splash outward as droplets hit the bottom (y < -6.5)
          float splash = smoothstep(-6.5, -9.5, pos.y);
          pos.x += aSeed.x * splash * 4.0;
          pos.z += aSeed.x * splash * 4.0;

          // Visibility envelope: peaks at 0.72, merges into ocean surface by 0.88
          float fadeIn = smoothstep(0.48, 0.68, uProgress);
          float fadeOut = 1.0 - smoothstep(0.82, 0.90, uProgress);
          vAlpha = fadeIn * fadeOut;
          vDropletY = pos.y;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (85.0 / -mvPos.z) * (1.0 + splash * 0.6);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying float vAlpha;
        varying float vDropletY;

        void main() {
          // Teardrop droplet shape
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;

          // Specular highlights on falling water beads
          float specular = pow(max(1.0 - length(coord - vec2(-0.1, -0.15)), 0.0), 3.0);
          vec3 waterCol = mix(vec3(0.05, 0.45, 0.85), vec3(0.35, 0.85, 1.0), specular);
          
          float strength = pow(1.0 - (dist * 2.0), 1.5);
          gl_FragColor = vec4(waterCol, strength * vAlpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const droplets = new THREE.Points(dropletGeo, dropletMaterial);
    scene.add(droplets);

    // --- 7. Large 3D Rolling Ocean Surface (Stages 4 & 5: 0.75 – 1.00) ---
    const oceanPlaneGeo = new THREE.PlaneGeometry(38, 38, 120, 120);
    const oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uSunDir: { value: sunDir },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        varying vec2 vUv;
        varying float vHeight;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Continuous multi-octave wave displacement
          float t = uTime * 1.5;
          float w1 = sin(pos.x * 0.48 + t * 1.1) * cos(pos.y * 0.42 + t * 0.85) * 0.55;
          float w2 = sin(pos.x * 0.92 - t * 1.4 + pos.y * 0.55) * 0.26;
          float w3 = cos(pos.x * 1.9 + pos.y * 1.7 + t * 2.2) * 0.11;
          float h = w1 + w2 + w3;

          pos.z += h;
          vHeight = h;

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;

          // Normal estimation for dynamic wave lighting
          float eps = 0.06;
          float hx = sin((pos.x + eps) * 0.48 + t * 1.1) * cos(pos.y * 0.42 + t * 0.85) * 0.55;
          float hy = sin(pos.x * 0.48 + t * 1.1) * cos((pos.y + eps) * 0.42 + t * 0.85) * 0.55;
          vec3 n = normalize(vec3(-(hx - h) / eps, -(hy - h) / eps, 1.0));
          vNormal = normalMatrix * n;

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uProgress;
        uniform vec3 uSunDir;
        varying vec2 vUv;
        varying float vHeight;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          // Scientific ocean color palette: deep abyss to turquoise crest
          vec3 deepAbyss = vec3(0.01, 0.04, 0.12);
          vec3 midWater = vec3(0.03, 0.24, 0.48);
          vec3 crestTeal = vec3(0.06, 0.55, 0.78);
          vec3 foamWhite = vec3(0.82, 0.94, 1.0);

          float normH = clamp((vHeight + 0.75) / 1.5, 0.0, 1.0);
          vec3 oceanCol = mix(deepAbyss, midWater, smoothstep(0.12, 0.58, normH));
          oceanCol = mix(oceanCol, crestTeal, smoothstep(0.58, 0.86, normH));

          // Subtle foam on wave crests
          float foam = smoothstep(0.82, 0.98, normH);
          oceanCol = mix(oceanCol, foamWhite, foam * 0.65);

          // Specular highlights and sun glint
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 lightDir = normalize(uSunDir);
          vec3 halfDir = normalize(lightDir + viewDir);
          float spec = pow(max(dot(vNormal, halfDir), 0.0), 48.0);
          oceanCol += vec3(0.65, 0.92, 1.0) * spec * 1.45;

          // Radial edge falloff to avoid harsh geometry edges
          float edgeFade = 1.0 - smoothstep(13.0, 18.5, length(vWorldPos.xy));

          // Smooth fade in as liquid Earth falls into the ocean (0.74 to 0.88)
          // Remains fully present and active continuously at 1.00
          float introAlpha = smoothstep(0.74, 0.88, uProgress);
          float finalAlpha = introAlpha * edgeFade * 0.94;

          gl_FragColor = vec4(oceanCol, finalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    const oceanMesh = new THREE.Mesh(oceanPlaneGeo, oceanMaterial);
    oceanMesh.rotation.x = -Math.PI / 2.3;
    oceanMesh.position.set(0, -5.8, -1.0);
    scene.add(oceanMesh);

    // --- Animation & Responsive Loop ---
    let animId;
    let clock = new THREE.Clock();
    let currentScroll = 0;

    // Determine initial Earth placement based on screen width
    const updateLayout = () => {
      const curW = container.clientWidth || window.innerWidth;
      const curH = container.clientHeight || (window.innerHeight - 68);
      camera.aspect = curW / curH;
      camera.updateProjectionMatrix();
      renderer.setSize(curW, curH);

      // On desktop, offset slightly to the right to frame text on the left
      // On mobile, keep centered
      if (curW > 900) {
        earthMesh.position.x = 1.4;
        earthMesh.scale.set(1.0, 1.0, 1.0);
      } else if (curW > 600) {
        earthMesh.position.x = 0.6;
        earthMesh.scale.set(0.85, 0.85, 0.85);
      } else {
        earthMesh.position.x = 0.0;
        earthMesh.scale.set(0.72, 0.72, 0.72);
      }
    };
    updateLayout();

    const render = () => {
      animId = requestAnimationFrame(render);

      const elapsedTime = clock.getElapsedTime();

      // Read target scroll progress from ref (0.0 to 1.0)
      const targetScroll = scrollProgressRef && typeof scrollProgressRef.current === 'number' 
        ? Math.min(Math.max(scrollProgressRef.current, 0), 1) 
        : 0;

      // Smooth lerp scroll progress for continuous motion
      currentScroll += (targetScroll - currentScroll) * 0.075;

      // Update shader uniforms
      starMaterial.uniforms.uTime.value = elapsedTime;
      earthMaterial.uniforms.uTime.value = elapsedTime;
      earthMaterial.uniforms.uProgress.value = currentScroll;
      atmosMaterial.uniforms.uProgress.value = currentScroll;
      currentMaterial.uniforms.uTime.value = elapsedTime;
      currentMaterial.uniforms.uProgress.value = currentScroll;
      dropletMaterial.uniforms.uTime.value = elapsedTime;
      dropletMaterial.uniforms.uProgress.value = currentScroll;
      oceanMaterial.uniforms.uTime.value = elapsedTime;
      oceanMaterial.uniforms.uProgress.value = currentScroll;

      // Rotation Choreography:
      // In stage 1 (0.00 - 0.25): slow natural auto-rotation
      // In stage 2 (0.25 - 0.50): scroll drives rotation to bring the Indian Ocean directly toward camera
      // Indian Ocean center longitude is ~75°E, with ~18°N latitude
      const autoRot = prefersReducedMotion ? 0 : elapsedTime * 0.05;
      const indianOceanAngle = -1.35; // Aligns Indian subcontinent & Indian Ocean basin to camera
      const scrollRotation = THREE.MathUtils.lerp(0, indianOceanAngle, smoothstep(0.12, 0.45, currentScroll));

      earthMesh.rotation.y = autoRot + scrollRotation;
      // Slight axial tilt for natural oceanographic perspective
      earthMesh.rotation.x = 0.25 + smoothstep(0.25, 0.55, currentScroll) * 0.15;
      earthMesh.rotation.z = -0.08;

      // Camera transitions smoothly downward as water falls and ocean emerges
      const targetCamY = THREE.MathUtils.lerp(0.5, -2.6, smoothstep(0.68, 0.95, currentScroll));
      const targetCamZ = THREE.MathUtils.lerp(9.8, 8.5, smoothstep(0.72, 1.0, currentScroll));
      camera.position.y += (targetCamY - camera.position.y) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;

      const lookTargetY = THREE.MathUtils.lerp(0.0, -4.5, smoothstep(0.72, 0.96, currentScroll));
      camera.lookAt(0, lookTargetY, 0);

      renderer.render(scene, camera);
    };

    render();

    // Helper math function
    function smoothstep(min, max, value) {
      const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
      return x * x * (3 - 2 * x);
    }

    const handleResize = () => {
      updateLayout();
    };
    window.addEventListener('resize', handleResize);

    // --- Cleanup on Unmount ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);

      // Clean up geometries and materials
      starGeometry.dispose();
      starMaterial.dispose();
      earthGeo.dispose();
      earthMaterial.dispose();
      atmosGeo.dispose();
      atmosMaterial.dispose();
      flowGeo.dispose();
      currentMaterial.dispose();
      dropletGeo.dispose();
      dropletMaterial.dispose();
      oceanPlaneGeo.dispose();
      oceanMaterial.dispose();
      earthTexture.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [scrollProgressRef]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 top-[68px] w-full h-[calc(100vh-68px)] pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
