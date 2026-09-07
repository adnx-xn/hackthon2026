import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useAppState } from '../../context/AppContext';
import { marchingCubes } from '../../utils/marchingCubes';
import { getColormapColor } from '../../utils/colormap';

export default function IsosurfaceRenderer() {
  const { 
    volumeData, 
    isosurfaceValue, 
    verticalExaggeration,
    colormapPalette,
    colormapMin,
    colormapMax,
    colormapScale,
    layerOpacity
  } = useAppState();

  const geometryRef = useRef();

  // Create geometry from Marching Cubes
  const geometry = useMemo(() => {
    if (!volumeData || isosurfaceValue === null || isosurfaceValue === undefined) return null;
    
    const { data, metadata } = volumeData;
    const { nx, ny, nz } = metadata.dimensions;
    const { longitudes, latitudes, depths } = metadata;
    
    // CPU synchronous marching cubes
    const { positions } = marchingCubes({
      data,
      nx, ny, nz,
      lon: longitudes,
      lat: latitudes,
      depth: depths,
      threshold: isosurfaceValue,
      verticalExaggeration
    });

    if (!positions || positions.length === 0) return "NO_DATA";

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Generate smooth normals
    geo.computeVertexNormals();

    return geo;
  }, [volumeData, isosurfaceValue, verticalExaggeration]);

  // Clean up geometry on unmount or change
  useEffect(() => {
    if (geometry) {
      geometryRef.current = geometry;
    }
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
    };
  }, [geometry]);

  if (!geometry) return null;
  if (geometry === "NO_DATA") {
    return (
      <Html center style={{ color: 'white', background: 'rgba(0,0,0,0.7)', padding: '10px 20px', borderRadius: '5px', whiteSpace: 'nowrap' }}>
        Isosurface requires 3D volumetric data. The current dataset is 2D or yielded no surface.
      </Html>
    );
  }

  // Determine surface color based on the selected value and active colormap
  const cMin = colormapMin !== null ? colormapMin : volumeData.metadata.value_min;
  const cMax = colormapMax !== null ? colormapMax : volumeData.metadata.value_max;
  
  // Use colormap util to find exactly what color this threshold represents
  const colorObj = getColormapColor(isosurfaceValue, cMin, cMax, colormapScale, colormapPalette);
  
  // Fallback to white if color fails
  const colorHex = colorObj ? colorObj.getHex() : 0xffffff;

  return (
    <group>
      {/* Provide local lighting for the isosurface so it's visibly 3D */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[15000, 10000, 15000]} intensity={2.0} />
      <directionalLight position={[-15000, -10000, -15000]} intensity={1.0} />
      
      <mesh geometry={geometry}>
        <meshStandardMaterial 
          color={colorHex}
          transparent={layerOpacity < 1.0}
          opacity={layerOpacity}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}
