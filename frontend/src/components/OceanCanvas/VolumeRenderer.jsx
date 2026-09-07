import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { useAppState } from '../../context/AppContext';
import { EARTH_RADIUS, DEPTH_SCALE } from '../../utils/sceneCoords';
import { createColormapTexture } from '../../utils/colormapTexture';

const volumeVertexShader = `
  varying vec3 vWorldPos;
  
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const volumeFragmentShader = `
  precision highp float;
  precision highp sampler3D;

  varying vec3 vWorldPos;
  
  uniform sampler3D u_volume;
  uniform sampler2D u_colormap;
  uniform float u_minVal;
  uniform float u_maxVal;
  uniform float u_opacity;
  uniform int u_scaleType; // 0 for linear, 1 for log
  uniform float u_nanValue; // NaN representation if applicable

  // Geographic bounds
  uniform float u_lonMin;
  uniform float u_lonMax;
  uniform float u_latMin;
  uniform float u_latMax;
  
  // Spherical shell bounds
  uniform float u_outerRadius;
  uniform float u_innerRadius;
  
  uniform vec3 u_cameraPos;
  
  // Depth slice highlighting
  uniform float u_highlightDepthRadius;

  const int MAX_STEPS = 200; // Ray marching steps

  vec2 intersectSphere(vec3 ro, vec3 rd, float radius) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - radius * radius;
    float h = b * b - c;
    if (h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
  }

  void main() {
    vec3 rayDir = normalize(vWorldPos - u_cameraPos);
    
    // Intersect with outer and inner spheres
    vec2 tOuter = intersectSphere(u_cameraPos, rayDir, u_outerRadius);
    vec2 tInner = intersectSphere(u_cameraPos, rayDir, u_innerRadius);
    
    // We only care about intersections if camera is outside the outer sphere
    // tOuter.x is the entry point into the outer sphere.
    // The ray exits the ocean volume either at tInner.x (hitting the inner boundary)
    // or tOuter.y (if it misses the inner core entirely and goes out the other side).
    
    if (tOuter.x < 0.0) {
      discard; // Ray completely misses the outer sphere
    }
    
    float tStart = max(0.0, tOuter.x);
    float tEnd = tOuter.y;
    
    if (tInner.x > 0.0) {
      // Ray hits the inner core
      tEnd = min(tEnd, tInner.x);
    }
    
    if (tStart >= tEnd) {
      discard;
    }

    float stepSize = (u_outerRadius - u_innerRadius) / 25.0; // Dynamic step size
    if (stepSize < 0.1) stepSize = 0.1;

    vec4 finalColor = vec4(0.0);
    float t = tStart;
    
    for (int i = 0; i < MAX_STEPS; i++) {
      if (t > tEnd || finalColor.a > 0.95) break;
      
      vec3 pos = u_cameraPos + t * rayDir;
      float r = length(pos);
      
      // Calculate geographic coordinates
      float lat = asin(pos.y / r) * (180.0 / 3.14159265359);
      float lon = atan(pos.z, pos.x) * (180.0 / 3.14159265359);
      
      // Check if within data geographic bounds
      if (lon >= u_lonMin && lon <= u_lonMax && lat >= u_latMin && lat <= u_latMax) {
        
        // Map to texture coordinates (u, v, w)
        // Texture axes: depth (w) -> lat (v) -> lon (u) based on dimension_order
        // But Three.js Data3DTexture expects X=width(lon), Y=height(lat), Z=depth
        
        // u = longitude (X)
        float u = (lon - u_lonMin) / (u_lonMax - u_lonMin);
        
        // v = latitude (Y)
        float v = (lat - u_latMin) / (u_latMax - u_latMin);
        
        // w = depth (Z)
        // R ranges from u_innerRadius to u_outerRadius
        // But depth is 0 at u_outerRadius, and max at u_innerRadius.
        // So w = 0 at u_outerRadius, w = 1 at u_innerRadius
        float w = (u_outerRadius - r) / (u_outerRadius - u_innerRadius);
        
        // Sample texture
        float val = texture(u_volume, vec3(u, v, w)).r;
        
        // Check for NaN or missing values
        if (!isnan(val)) {
          // Normalize value
          float normVal = 0.0;
          if (u_scaleType == 1 && val > 0.0 && u_minVal > 0.0) {
            float logVal = log(val);
            float logMin = log(u_minVal);
            float logMax = log(u_maxVal);
            normVal = clamp((logVal - logMin) / (logMax - logMin), 0.0, 1.0);
          } else {
            normVal = clamp((val - u_minVal) / (u_maxVal - u_minVal), 0.0, 1.0);
          }
          
          // Get color from colormap
          vec4 color = texture(u_colormap, vec2(normVal, 0.5));
          
          // Alpha depends on u_opacity and a base density factor
          float alpha = u_opacity * 0.15; // tuning factor for accumulation
          
          // Highlight depth slice if active
          if (abs(r - u_highlightDepthRadius) < stepSize) {
             alpha += 0.3; // Make the active depth more visible
          }

          color.a *= alpha;
          
          // Front-to-back alpha compositing
          color.rgb *= color.a;
          finalColor += color * (1.0 - finalColor.a);
        }
      }
      
      t += stepSize;
    }
    
    if (finalColor.a < 0.01) discard;
    
    gl_FragColor = finalColor;
  }
`;

export default function VolumeRenderer() {
  const { camera } = useThree();
  const { 
    volumeData, 
    colormapPalette, 
    colormapMin, 
    colormapMax, 
    colormapScale, 
    layerOpacity, 
    verticalExaggeration,
    activeDepthIndex
  } = useAppState();

  const materialRef = useRef();
  const textureRef = useRef();

  // Create Colormap Texture
  const colormapTexture = useMemo(() => {
    return createColormapTexture(colormapPalette, 256);
  }, [colormapPalette]);

  // Create Data3DTexture when volumeData changes
  useEffect(() => {
    if (!volumeData) return;

    const { metadata, data } = volumeData;
    const { nx, ny, nz } = metadata.dimensions;

    // Dispose old texture to prevent GPU leaks
    if (textureRef.current) {
      textureRef.current.dispose();
    }

    // In Three.js, width = X, height = Y, depth = Z.
    // Our binary array memory order is DEPTH -> LAT -> LON.
    // This perfectly matches Three.js which expects the array to be indexed by:
    // index = x + width * (y + height * z)
    // where x changes fastest. So X = lon, Y = lat, Z = depth.
    const texture3D = new THREE.Data3DTexture(data, nx, ny, nz);
    texture3D.format = THREE.RedFormat;
    texture3D.type = THREE.FloatType;
    texture3D.minFilter = THREE.LinearFilter;
    texture3D.magFilter = THREE.LinearFilter;
    texture3D.unpackAlignment = 1;
    texture3D.needsUpdate = true;

    textureRef.current = texture3D;

    if (materialRef.current) {
      materialRef.current.uniforms.u_volume.value = texture3D;
    }

    return () => {
      // Clean up texture when data changes or component unmounts
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [volumeData]);

  // Update Uniforms
  useEffect(() => {
    if (!materialRef.current || !volumeData) return;

    const { metadata } = volumeData;
    
    // Resolve Min/Max
    const cMin = colormapMin !== null ? colormapMin : metadata.value_min;
    const cMax = colormapMax !== null ? colormapMax : metadata.value_max;

    // Depth conversions for spherical mapping
    const maxPhysicalDepth = metadata.depths[metadata.depths.length - 1];
    
    // Ensure the volume has some visible thickness even if max depth is 0
    const effectiveMaxDepth = maxPhysicalDepth > 0 ? maxPhysicalDepth : 10.0;
    
    const innerRadius = EARTH_RADIUS - (effectiveMaxDepth * DEPTH_SCALE * verticalExaggeration);

    // Active Depth Highlight
    const activeDepth = metadata.depths[activeDepthIndex] || 0;
    const activeRadius = EARTH_RADIUS - (activeDepth * DEPTH_SCALE * verticalExaggeration);

    const uniforms = materialRef.current.uniforms;
    uniforms.u_colormap.value = colormapTexture;
    uniforms.u_minVal.value = cMin;
    uniforms.u_maxVal.value = cMax;
    uniforms.u_opacity.value = layerOpacity;
    uniforms.u_scaleType.value = colormapScale === 'log' ? 1 : 0;
    
    // Geographics
    uniforms.u_lonMin.value = metadata.longitudes[0];
    uniforms.u_lonMax.value = metadata.longitudes[metadata.longitudes.length - 1];
    uniforms.u_latMin.value = metadata.latitudes[0]; // Ascending order
    uniforms.u_latMax.value = metadata.latitudes[metadata.latitudes.length - 1];
    
    // Shell Radii
    uniforms.u_outerRadius.value = EARTH_RADIUS;
    uniforms.u_innerRadius.value = innerRadius;
    uniforms.u_highlightDepthRadius.value = activeRadius;

  }, [volumeData, colormapTexture, colormapMin, colormapMax, colormapScale, layerOpacity, verticalExaggeration, activeDepthIndex]);

  // Update camera position continuously for the shader
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_cameraPos.value.copy(state.camera.position);
    }
  });

  // Use a SphereGeometry equal to EARTH_RADIUS to act as the front-face entry point for the raymarching
  const geometry = useMemo(() => new THREE.SphereGeometry(EARTH_RADIUS, 64, 64), []);

  // Cleanup geometry on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      if (materialRef.current) materialRef.current.dispose();
    };
  }, [geometry]);

  if (!volumeData) return null;

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={volumeVertexShader}
        fragmentShader={volumeFragmentShader}
        uniforms={{
          u_volume: { value: null },
          u_colormap: { value: null },
          u_minVal: { value: 0 },
          u_maxVal: { value: 1 },
          u_opacity: { value: 1 },
          u_scaleType: { value: 0 },
          u_lonMin: { value: -180 },
          u_lonMax: { value: 180 },
          u_latMin: { value: -90 },
          u_latMax: { value: 90 },
          u_outerRadius: { value: EARTH_RADIUS },
          u_innerRadius: { value: EARTH_RADIUS - 100 },
          u_cameraPos: { value: new THREE.Vector3() },
          u_highlightDepthRadius: { value: EARTH_RADIUS }
        }}
        transparent={true}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
