import React, { useMemo } from 'react';
import * as THREE from 'three';
import { EARTH_RADIUS } from '../../utils/sceneCoords';

// Same fixed visual scale as TopographicEarth — keeps the two layers aligned.
const TERRAIN_VISUAL_SCALE = 0.002;

export default function BathymetricLayer({ terrainData }) {
  // Build a DataTexture from the Float32Array terrain data.
  // flipY=false: row 0 of array (=North, 40N) maps to v=1 in UV space (north pole).
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
      uniform vec4 uBounds;

      varying float vElevation;

      float subtleNoise(vec2 pt) {
        return sin(pt.x * 0.08) * cos(pt.y * 0.12) * 15.0
             + sin(pt.x * 0.31 + pt.y * 0.19) * 8.0;
      }

      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>

      // Correct UV → lat/lon for THREE.SphereGeometry
      // uv.y=0 = south pole, uv.y=1 = north pole
      float lon = (uv.x * 360.0) - 180.0;
      float lat = -90.0 + (uv.y * 180.0);
      float elevation = 0.0;

      if (uHasTerrain > 0.5) {
        float lonMin = uBounds.x;
        float lonMax = uBounds.y;
        float latMin = uBounds.z;
        float latMax = uBounds.w;

        float blendSize = 1.5;
        float blendLon = smoothstep(lonMin - blendSize, lonMin, lon)
                       * (1.0 - smoothstep(lonMax, lonMax + blendSize, lon));
        float blendLat = smoothstep(latMin - blendSize, latMin, lat)
                       * (1.0 - smoothstep(latMax, latMax + blendSize, lat));
        float blend = blendLon * blendLat;

        float fallbackElev = subtleNoise(vec2(lon, lat));

        if (blend > 0.0) {
          float uData = (lon - lonMin) / (lonMax - lonMin);
          float vData = (lat - latMin) / (latMax - latMin);
          float etopoElev = texture2D(uTerrainData, vec2(uData, vData)).r;
          elevation = mix(fallbackElev, etopoElev, blend);
        } else {
          elevation = fallbackElev;
        }
      } else {
        elevation = 0.0;
      }

      vElevation = elevation;

      // Bathymetric layer: only displace inward (ocean floor).
      // Land pixels (elevation >= 0) are discarded in the fragment shader.
      float depthDisplacement = min(0.0, elevation) * uTerrainScale;
      transformed += normal * depthDisplacement;
      `
    );

    shader.fragmentShader = `
      varying float vElevation;
      ${shader.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      // Discard land (non-negative elevation) so only the ocean floor is shown.
      if (vElevation >= 0.0) {
        discard;
      }
      `
    );
  };

  return (
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[EARTH_RADIUS, 256, 256]} />
      <meshBasicMaterial
        color="#003366"
        onBeforeCompile={onBeforeCompile}
        transparent={true}
        opacity={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
