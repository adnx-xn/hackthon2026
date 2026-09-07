import React, { useMemo } from 'react';
import * as THREE from 'three';
import { EARTH_RADIUS } from '../../utils/sceneCoords';

// Fixed terrain visual scale, independent of DEPTH_SCALE and verticalExaggeration.
// EARTH_RADIUS=5000. Real Earth relief is ~0.3% of radius.
// 8157m Himalaya -> ~16 units (0.33% of 5000). 7368m deep ocean -> ~15 units.
// This keeps the globe spherical while showing clearly visible topography.
const TERRAIN_VISUAL_SCALE = 0.002;

export default function TopographicEarth({ texture, terrainData }) {
  // Build a DataTexture from the Float32Array terrain data.
  // The array has row 0 = North (lat 40N), row H-1 = South (lat -30S).
  // We use flipY=false so that UV v=0 (south pole) reads from the LAST row of the
  // array, and v=1 (north pole) reads from the FIRST row — matching the geographic orientation.
  const dataTexture = useMemo(() => {
    if (!terrainData || !terrainData.data || !terrainData.metadata) return null;
    const { width, height } = terrainData.metadata;
    const tex = new THREE.DataTexture(
      terrainData.data,
      width,
      height,
      THREE.RedFormat,
      THREE.FloatType
    );
    // flipY=false: row 0 of data array stays at top of texture (v=1 in UV space = north pole).
    // This matches our geographic convention: row 0 = 40N = top of texture = high v.
    tex.flipY = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [terrainData]);

  const onBeforeCompile = (shader) => {
    shader.uniforms.uTerrainData = { value: dataTexture };
    shader.uniforms.uHasTerrain = { value: dataTexture ? 1.0 : 0.0 };
    shader.uniforms.uTerrainScale = { value: TERRAIN_VISUAL_SCALE };
    shader.uniforms.uEarthRadius = { value: EARTH_RADIUS };

    if (terrainData && terrainData.metadata) {
      const bounds = terrainData.metadata.bounds;
      shader.uniforms.uBounds = {
        value: new THREE.Vector4(bounds.lon_min, bounds.lon_max, bounds.lat_min, bounds.lat_max)
      };
    } else {
      shader.uniforms.uBounds = { value: new THREE.Vector4(35, 120, -30, 40) };
    }

    shader.vertexShader = `
      uniform sampler2D uTerrainData;
      uniform float uHasTerrain;
      uniform float uTerrainScale;
      uniform float uEarthRadius;
      uniform vec4 uBounds; // x=lon_min, y=lon_max, z=lat_min, w=lat_max

      // Subtle deterministic noise for global fallback — max ~±30m visual equivalent
      float subtleNoise(vec2 pt) {
        return sin(pt.x * 0.08) * cos(pt.y * 0.12) * 15.0
             + sin(pt.x * 0.31 + pt.y * 0.19) * 8.0;
      }

      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // THREE.SphereGeometry UV convention:
      //   uv.x (u): 0 = left = -180 lon, 1 = right = +180 lon
      //   uv.y (v): 0 = south pole, 1 = north pole
      // Therefore:
      //   lon = uv.x * 360.0 - 180.0
      //   lat = -90.0 + uv.y * 180.0   (NOT 90 - uv.y*180!)
      float lon = (uv.x * 360.0) - 180.0;
      float lat = -90.0 + (uv.y * 180.0);
      float elevation = 0.0;

      if (uHasTerrain > 0.5) {
        float lonMin = uBounds.x; // 35
        float lonMax = uBounds.y; // 120
        float latMin = uBounds.z; // -30
        float latMax = uBounds.w; // 40

        // Smooth blend at ETOPO region boundary
        float blendSize = 1.5;
        float blendLon = smoothstep(lonMin - blendSize, lonMin, lon)
                       * (1.0 - smoothstep(lonMax, lonMax + blendSize, lon));
        float blendLat = smoothstep(latMin - blendSize, latMin, lat)
                       * (1.0 - smoothstep(latMax, latMax + blendSize, lat));
        float blend = blendLon * blendLat;

        float fallbackElev = subtleNoise(vec2(lon, lat));

        if (blend > 0.0) {
          // Map lon/lat to texture UV.
          // uData: 0 = lonMin (35E), 1 = lonMax (120E)
          float uData = (lon - lonMin) / (lonMax - lonMin);
          // vData: 0 = latMin (-30S), 1 = latMax (40N)
          // Data array row 0 = latMax (North). flipY=false means row 0 is at v=1 in texture UV.
          // So vData = (lat - latMin)/(latMax - latMin) correctly samples row 0 at v=1 (North).
          float vData = (lat - latMin) / (latMax - latMin);

          float etopoElev = texture2D(uTerrainData, vec2(uData, vData)).r;
          elevation = mix(fallbackElev, etopoElev, blend);
        } else {
          elevation = fallbackElev;
        }
      } else {
        // No terrain data loaded yet — zero displacement, just a sphere
        elevation = 0.0;
      }

      // Radial displacement: outward for land (>0), inward for bathymetry (<0).
      // TERRAIN_VISUAL_SCALE is a fixed display scale independent of vertical exaggeration.
      float displacement = elevation * uTerrainScale;
      transformed += normal * displacement;
      `
    );
  };

  return (
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[EARTH_RADIUS, 256, 256]} />
      <meshBasicMaterial
        map={texture}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  );
}
