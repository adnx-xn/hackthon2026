import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { useAppState } from '../../context/AppContext';
import { apiClient } from '../../api/apiClient';
import { geoToSpherical } from '../../utils/sceneCoords';

export default function VectorLayer() {
  const { activeDatasetId, verticalExaggeration, primaryView, vectorData } = useAppState();
  
  const groupRef = useRef();
  
  const showVectors = primaryView === 'Currents';

  // Handle rendering and cleanup
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    
    // Clear existing arrows and properly dispose geometries/materials
    group.children.forEach(child => {
      if (child instanceof THREE.ArrowHelper) {
        if (child.line.geometry) child.line.geometry.dispose();
        if (child.line.material) child.line.material.dispose();
        if (child.cone.geometry) child.cone.geometry.dispose();
        if (child.cone.material) child.cone.material.dispose();
      }
    });
    group.clear();
    
    if (!vectorData || !showVectors) return;
    
    const { lat, lon, u, v, speed_max } = vectorData;
    
    if (speed_max < 1e-10) return; // Prevent NaN length
    
    const M = lat.length;
    const N = lon.length;
    let totalPoints = M * N;
    
    // Determine stride to keep arrows <= 500
    let stride = 1;
    if (totalPoints > 500) {
      stride = Math.ceil(Math.sqrt(totalPoints / 500));
    }
    
    const baseColor = new THREE.Color(0xffffff); // White arrows for contrast
    const arrowLengthScale = 2.0; // Visual scaling factor
    
    for (let i = 0; i < M; i += stride) {
      for (let j = 0; j < N; j += stride) {
        const u_val = u[i][j];
        const v_val = v[i][j];
        
        if (u_val === null || v_val === null) continue;
        
        // AGENTS.md §3.8: Arrow direction and position
        const dir = new THREE.Vector3(u_val, 0, v_val).normalize();
        
        // Always render at physical depth 0 for surface mode
        const targetDepth = 0;
        
        // Map geographic origin to scene space (spherical only for Phase 11)
        const sphPos = geoToSpherical(lon[j], lat[i], targetDepth, verticalExaggeration);
        const origin = new THREE.Vector3(sphPos.x, sphPos.y, sphPos.z);
        
        // Reorient arrow direction for the sphere's local tangent plane.
        const normal = origin.clone().normalize();
        
        // Local North vector:
        const latRad = (lat[i] * Math.PI) / 180;
        const lonRad = (lon[j] * Math.PI) / 180;
        const north = new THREE.Vector3(
            -Math.sin(latRad) * Math.cos(lonRad),
            Math.cos(latRad),
            -Math.sin(latRad) * Math.sin(lonRad)
        ).normalize();
        
        // Local East vector:
        const east = new THREE.Vector3().crossVectors(north, normal).normalize();
        
        // Combine u (east) and v (north) to get world direction
        dir.copy(east).multiplyScalar(u_val).add(north.clone().multiplyScalar(v_val)).normalize();
        
        const speed = Math.sqrt(u_val * u_val + v_val * v_val);
        const length = (speed / speed_max) * arrowLengthScale;
        
        if (length > 0) {
          const arrowHelper = new THREE.ArrowHelper(dir, origin, length, baseColor, 0.2 * length, 0.1 * length);
          group.add(arrowHelper);
        }
      }
    }
    
  }, [vectorData, showVectors, verticalExaggeration]);

  // Clean up entirely on unmount
  useEffect(() => {
    const group = groupRef.current;
    return () => {
      if (group) {
        group.children.forEach(child => {
          if (child instanceof THREE.ArrowHelper) {
            if (child.line.geometry) child.line.geometry.dispose();
            if (child.line.material) child.line.material.dispose();
            if (child.cone.geometry) child.cone.geometry.dispose();
            if (child.cone.material) child.cone.material.dispose();
          }
        });
        group.clear();
      }
    };
  }, []);

  return <group ref={groupRef} visible={showVectors} />;
}
