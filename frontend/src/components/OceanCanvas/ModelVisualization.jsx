import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAppState } from '../../context/AppContext';
import { getColormapColor } from '../../utils/colormap';
import { geoToScene } from '../../utils/sceneCoords';

export default function ModelVisualization() {
  const { multiSliceData, activeDepthIndex, colormapPalette, colormapMin, colormapMax, colormapScale, verticalExaggeration, layerOpacity } = useAppState();
  
  const meshRef = useRef();

  // Create a combined BufferGeometry for all layers and vertical walls
  useEffect(() => {
    if (!multiSliceData || multiSliceData.length === 0 || !meshRef.current) return;
    
    // Sort by depth_index ascending (0 is surface)
    const sortedSlices = [...multiSliceData].sort((a, b) => a.depthIndex - b.depthIndex);
    
    // Use the first slice to get dimensions
    const baseSlice = sortedSlices[0];
    const lat = baseSlice.lat;
    const lon = baseSlice.lon;
    const M = lat.length;
    const N = lon.length;
    const K = sortedSlices.length;
    
    // Calculate global min/max across all fetched slices if not overridden
    let gMin = colormapMin;
    let gMax = colormapMax;
    if (gMin === null || gMax === null) {
      let calcMin = Infinity;
      let calcMax = -Infinity;
      for (const slice of sortedSlices) {
        if (slice.value_min < calcMin) calcMin = slice.value_min;
        if (slice.value_max > calcMax) calcMax = slice.value_max;
      }
      if (gMin === null) gMin = calcMin;
      if (gMax === null) gMax = calcMax;
    }

    const positions = [];
    const colors = [];
    const indices = [];
    let vOffset = 0;

    function addQuad(p1, p2, p3, p4, c1, c2, c3, c4) {
      positions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
      colors.push(c1.r, c1.g, c1.b, c1.a, c2.r, c2.g, c2.b, c2.a, c3.r, c3.g, c3.b, c3.a, c4.r, c4.g, c4.b, c4.a);
      // Triangle 1
      indices.push(vOffset, vOffset+1, vOffset+2);
      // Triangle 2
      indices.push(vOffset+2, vOffset+1, vOffset+3);
      vOffset += 4;
    }

    function vValid(k, i, j) {
      if (k < 0 || k >= K || i < 0 || i >= M || j < 0 || j >= N) return false;
      return sortedSlices[k].values[i][j] !== null;
    }

    function getPos(k, i, j) {
      const depth_m = sortedSlices[k].depth_m;
      return geoToScene(lon[j], depth_m, lat[i], verticalExaggeration);
    }

    function getColorObj(k, i, j, alpha) {
      const val = sortedSlices[k].values[i][j];
      if (val === null) return { r: 0, g: 0, b: 0, a: 0 };
      const c = getColormapColor(val, gMin, gMax, colormapScale, colormapPalette);
      return c ? { r: c.r, g: c.g, b: c.b, a: alpha } : { r: 0, g: 0, b: 0, a: 0 };
    }

    const activeAlpha = layerOpacity;
    const inactiveAlpha = layerOpacity * 0.4;
    const wallAlpha = layerOpacity * 0.9;

    // 1. Draw horizontal layers
    for (let k = 0; k < K; k++) {
      const slice = sortedSlices[k];
      const isHighlighted = (slice.depthIndex === activeDepthIndex);
      const alpha = isHighlighted ? activeAlpha : inactiveAlpha;
      
      for (let i = 0; i < M - 1; i++) {
        for (let j = 0; j < N - 1; j++) {
          if (vValid(k, i, j) && vValid(k, i+1, j) && vValid(k, i, j+1) && vValid(k, i+1, j+1)) {
            addQuad(
              getPos(k, i, j), getPos(k, i, j+1), getPos(k, i+1, j), getPos(k, i+1, j+1),
              getColorObj(k, i, j, alpha), getColorObj(k, i, j+1, alpha), getColorObj(k, i+1, j, alpha), getColorObj(k, i+1, j+1, alpha)
            );
          }
        }
      }
    }

    // 2. Draw vertical curtain walls between layer k and k+1
    for (let k = 0; k < K - 1; k++) {
      const alpha = wallAlpha;
      for (let i = 0; i < M - 1; i++) {
        for (let j = 0; j < N - 1; j++) {
          const qValid = vValid(k, i, j) && vValid(k, i+1, j) && vValid(k, i, j+1) && vValid(k, i+1, j+1);
          const qBelowValid = vValid(k+1, i, j) && vValid(k+1, i+1, j) && vValid(k+1, i, j+1) && vValid(k+1, i+1, j+1);
          
          if (qValid && qBelowValid) {
            // South edge (i)
            if (i === 0 || !(vValid(k, i-1, j) && vValid(k, i, j) && vValid(k, i-1, j+1) && vValid(k, i, j+1))) {
              addQuad(
                getPos(k, i, j), getPos(k, i, j+1), getPos(k+1, i, j), getPos(k+1, i, j+1),
                getColorObj(k, i, j, alpha), getColorObj(k, i, j+1, alpha), getColorObj(k+1, i, j, alpha), getColorObj(k+1, i, j+1, alpha)
              );
            }
            
            // North edge (i+1)
            if (i === M-2 || !(vValid(k, i+1, j) && vValid(k, i+2, j) && vValid(k, i+1, j+1) && vValid(k, i+2, j+1))) {
              addQuad(
                getPos(k, i+1, j), getPos(k, i+1, j+1), getPos(k+1, i+1, j), getPos(k+1, i+1, j+1),
                getColorObj(k, i+1, j, alpha), getColorObj(k, i+1, j+1, alpha), getColorObj(k+1, i+1, j, alpha), getColorObj(k+1, i+1, j+1, alpha)
              );
            }
            
            // West edge (j)
            if (j === 0 || !(vValid(k, i, j-1) && vValid(k, i+1, j-1) && vValid(k, i, j) && vValid(k, i+1, j))) {
              addQuad(
                getPos(k, i, j), getPos(k, i+1, j), getPos(k+1, i, j), getPos(k+1, i+1, j),
                getColorObj(k, i, j, alpha), getColorObj(k, i+1, j, alpha), getColorObj(k+1, i, j, alpha), getColorObj(k+1, i+1, j, alpha)
              );
            }
            
            // East edge (j+1)
            if (j === N-2 || !(vValid(k, i, j+1) && vValid(k, i+1, j+1) && vValid(k, i, j+2) && vValid(k, i+1, j+2))) {
              addQuad(
                getPos(k, i, j+1), getPos(k, i+1, j+1), getPos(k+1, i, j+1), getPos(k+1, i+1, j+1),
                getColorObj(k, i, j+1, alpha), getColorObj(k, i+1, j+1, alpha), getColorObj(k+1, i, j+1, alpha), getColorObj(k+1, i+1, j+1, alpha)
              );
            }
          }
        }
      }
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = meshRef.current;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    mesh.geometry = geo;
    
  }, [multiSliceData, activeDepthIndex, colormapPalette, colormapMin, colormapMax, colormapScale, verticalExaggeration, layerOpacity]);

  // Clean up on unmount
  useEffect(() => {
    const mesh = meshRef.current;
    return () => {
      if (mesh) {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      }
    };
  }, []);

  if (!multiSliceData || multiSliceData.length === 0) return null;

  return (
    <mesh ref={meshRef}>
      <meshBasicMaterial 
        vertexColors={true}
        transparent={true}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
