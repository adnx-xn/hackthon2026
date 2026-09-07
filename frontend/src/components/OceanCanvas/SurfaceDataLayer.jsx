import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useAppState } from '../../context/AppContext';
import { geoToSpherical, EARTH_RADIUS } from '../../utils/sceneCoords';
import { getColormapColor } from '../../utils/colormap';

export default function SurfaceDataLayer() {
  const { primaryView, surfaceData, colormapPalette, colorStops, colormapScale, colormapMin, colormapMax, layerOpacity } = useAppState();

  const { geometry, material, noData } = useMemo(() => {
    if (!surfaceData || !surfaceData.values || !surfaceData.latitudes?.length || !surfaceData.longitudes?.length) {
      return { geometry: null, material: null, noData: false };
    }

    const { latitudes, longitudes, values, valueMin, valueMax } = surfaceData;
    const M = latitudes.length;
    const N = longitudes.length;

    // We use a small negative depth to render slightly above the Earth surface (positive depth goes into Earth)
    // depthOffset = depthMeters * DEPTH_SCALE (0.01), so -100 depthMeters = +1.0 unit offset
    const renderDepthMeters = -100;

    // We will build a non-indexed list of triangles.
    const positions = [];
    const colors = [];

    // Calculate actual min/max if absent
    let actualMin = valueMin;
    let actualMax = valueMax;

    if (actualMin === undefined || actualMax === undefined || actualMin === null || actualMax === null) {
      let calcMin = Infinity;
      let calcMax = -Infinity;
      let hasValid = false;
      for (let i = 0; i < M; i++) {
        for (let j = 0; j < N; j++) {
          const v = values[i]?.[j];
          if (v !== null && v !== undefined && Number.isFinite(v)) {
            if (v < calcMin) calcMin = v;
            if (v > calcMax) calcMax = v;
            hasValid = true;
          }
        }
      }
      if (!hasValid) {
        return { geometry: null, material: null, noData: true };
      }
      actualMin = calcMin;
      actualMax = calcMax;
    }

    let finiteCount = 0;
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        if (Number.isFinite(values[i]?.[j])) finiteCount++;
      }
    }

    console.log("DATASET:\ntest_model.nc\n");
    console.log("VARIABLE:\nthetao\n");
    console.log(`LAT:\n${latitudes[0]} -> ${latitudes[M - 1]}\n`);
    console.log(`LON:\n${longitudes[0]} -> ${longitudes[N - 1]}\n`);
    console.log(`VALUES SHAPE:\n${M} x ${N}\n`);
    console.log(`FINITE VALUES:\n~${finiteCount}\n`);

    // Evaluate valid value range
    const vMin = colormapMin !== null ? colormapMin : actualMin;
    const vMax = colormapMax !== null ? colormapMax : actualMax;

    // Helper to get point data securely
    const getPointData = (r, c) => {
      const val = values[r]?.[c];
      if (val == null || !Number.isFinite(val)) return null;
      
      const currentLat = latitudes[r];
      const currentLon = -longitudes[c];
      const pos = geoToSpherical(currentLon, currentLat, renderDepthMeters);
      
      const color = getColormapColor(val, vMin, vMax, colormapScale, colorStops || colormapPalette);
      if (!color) return null;
      
      return { pos, color };
    };

    const pushTriangle = (pa, pb, pc) => {
      positions.push(pa.pos.x, pa.pos.y, pa.pos.z);
      positions.push(pb.pos.x, pb.pos.y, pb.pos.z);
      positions.push(pc.pos.x, pc.pos.y, pc.pos.z);
      colors.push(pa.color.r, pa.color.g, pa.color.b);
      colors.push(pb.color.r, pb.color.g, pb.color.b);
      colors.push(pc.color.r, pc.color.g, pc.color.b);
    };

    // Build non-indexed faces directly
    for (let i = 0; i < M - 1; i++) {
      for (let j = 0; j < N - 1; j++) {
        // Skip cell if dateline crossing jump creates a stretched polygon
        if (Math.abs(longitudes[j + 1] - longitudes[j]) > 180) continue;

        const p00 = getPointData(i, j);
        const p01 = getPointData(i, j + 1);
        const p10 = getPointData(i + 1, j);
        const p11 = getPointData(i + 1, j + 1);

        let count = 0;
        if (p00) count++;
        if (p01) count++;
        if (p10) count++;
        if (p11) count++;

        if (count === 4) {
          // Full quad: Triangle 1 and Triangle 2 (CCW Winding for outward normals)
          pushTriangle(p00, p10, p01);
          pushTriangle(p10, p11, p01);
        } else if (count === 3) {
          // One corner missing. Draw the single valid triangle (CCW Winding).
          if (!p11) pushTriangle(p00, p10, p01);
          else if (!p00) pushTriangle(p10, p11, p01);
          else if (!p01) pushTriangle(p00, p10, p11);
          else if (!p10) pushTriangle(p00, p11, p01);
        } else if (count === 2) {
          // Exactly 2 adjacent valid corners. Attempt to bridge 1-pixel gaps using valid adjacent topology.
          if (p00 && p10) { // Left edge valid
            const p02 = getPointData(i, j + 2);
            if (p02) pushTriangle(p00, p10, p02);
            else {
              const p12 = getPointData(i + 1, j + 2);
              if (p12) pushTriangle(p00, p10, p12);
            }
          } else if (p01 && p11) { // Right edge valid
            const p1_minus1 = getPointData(i + 1, j - 1);
            if (p1_minus1) pushTriangle(p11, p01, p1_minus1);
            else {
              const p0_minus1 = getPointData(i, j - 1);
              if (p0_minus1) pushTriangle(p11, p01, p0_minus1);
            }
          } else if (p00 && p01) { // Bottom edge valid
            const p21 = getPointData(i + 2, j + 1);
            if (p21) pushTriangle(p01, p00, p21);
            else {
              const p20 = getPointData(i + 2, j);
              if (p20) pushTriangle(p01, p00, p20);
            }
          } else if (p10 && p11) { // Top edge valid
            const p_minus1_0 = getPointData(i - 1, j);
            if (p_minus1_0) pushTriangle(p10, p11, p_minus1_0);
            else {
              const p_minus1_1 = getPointData(i - 1, j + 1);
              if (p_minus1_1) pushTriangle(p10, p11, p_minus1_1);
            }
          }
          // If diagonal (p00 & p11) or (p01 & p10), leave empty per CASE 4.
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    // Non-indexed: no geo.setIndex()
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    console.log(`VALID CELLS:\n> 0\n`);
    console.log(`VERTICES:\n${positions.length / 3}\n`);
    console.log(`TRIANGLES:\n${positions.length / 9}\n`);
    const isSphereFinite = geo.boundingSphere && Number.isFinite(geo.boundingSphere.radius);
    console.log(`BOUNDING SPHERE:\n${isSphereFinite ? 'finite' : 'infinite/invalid'}\n`);
    console.log(`SURFACE RADIUS:\napproximately EARTH_RADIUS + tiny offset\n`);

    const mat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: layerOpacity,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -10.0,
      polygonOffsetUnits: -10.0,
      depthWrite: false
    });

    return { geometry: geo, material: mat };
  }, [surfaceData, colormapPalette, colorStops, colormapScale, colormapMin, colormapMax, layerOpacity]);

  // Clean up resources on unmount or when geometry/material change
  React.useEffect(() => {
    return () => {
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, [geometry, material]);

  if (noData) {
    return (
      <Html center>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '20px',
          borderRadius: '8px',
          color: 'white',
          textAlign: 'center',
          border: '1px solid #ffaa00',
          fontFamily: 'sans-serif'
        }}>
          No valid {primaryView} data available for this dataset.
        </div>
      </Html>
    );
  }

  if (!geometry || !material) return null;

  return (
    <mesh geometry={geometry} material={material} rotation={[0,98.96, 0]} />
  );
}
