import React, { useMemo, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import VectorLayer from './VectorLayer';
import SurfaceDataLayer from './SurfaceDataLayer';
import ObservationMarkers from './ObservationMarkers';
import EarthBase from './EarthBase';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import ScientificLegend from '../ScientificLegend/ScientificLegend';
import { useAppState } from '../../context/AppContext';
import datasetProfiles from '../../config/datasetProfiles.json';

function CameraUpdater({ center, maxDim, showEarth }) {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    if (showEarth) {
      // Set camera for Earth globe view once when toggled
      camera.position.set(0, 0, 25000);
      camera.near = 1;
      camera.far = 100000;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      if (controls) controls.target.set(0, 0, 0);
    } else if (maxDim > 0) {
      // Old flat map camera logic
      camera.position.set(center.x + maxDim * 0.5, maxDim * 1.2, center.z + maxDim * 1.5);
      camera.near = 0.1;
      camera.far = 10000;
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      if (controls) controls.target.copy(center);
    }
  }, [showEarth]); // ONLY depend on showEarth to prevent resetting camera during render

  return null;
}

export default function OceanCanvas() {
  const { activeDatasetMeta, showEarth, primaryView } = useAppState();

  // Compute the geographic center and max dimension of the active dataset (for flat map)
  const { center, maxDim } = useMemo(() => {
    if (activeDatasetMeta) {
      const { lat_min, lat_max, lon_min, lon_max } = activeDatasetMeta;
      const cx = (lon_min + lon_max) / 2;
      const cz = (lat_min + lat_max) / 2;
      const width = lon_max - lon_min;
      const height = lat_max - lat_min;
      return {
        center: new THREE.Vector3(cx, 0, cz),
        maxDim: Math.max(width, height, 10)
      };
    }
    return { center: new THREE.Vector3(70, 0, -15), maxDim: 60 };
  }, [activeDatasetMeta]);

  // Stable target for OrbitControls when showing Earth
  const earthTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 25000], fov: 45, near: 1, far: 100000 }}
        className="w-full h-full bg-[#020208ff]"
      >
      {/* Disable directional lighting for uniform Earth appearance. 
          When ocean layers are added later, lighting may be re-enabled for them. */}
      {!showEarth && (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight position={[150, 100, 150]} intensity={1.5} />
        </>
      )}
      
      <CameraUpdater center={center} maxDim={maxDim} showEarth={showEarth} />
      
      <OrbitControls 
        makeDefault 
        target={showEarth ? earthTarget : center}
        enableDamping={true}
        dampingFactor={0.05}
        zoomSpeed={0.4}
        rotateSpeed={0.5}
        minDistance={showEarth ? 5005 : 0}
        maxDistance={showEarth ? 40000 : Infinity}
      />

      {/* Earth Base Layer */}
      {showEarth && <EarthBase />}

      {/* Axis Helper for visual orientation (X=Red, Y=Green, Z=Blue) */}
      {/* Hide axes when showing Earth to not clutter the scientific view */}
      {!showEarth && <axesHelper args={[maxDim * 0.5]} position={center} />}

      {/* Visualization Layers */}
      <ErrorBoundary>
        {(() => {
          if (!activeDatasetMeta || !primaryView || primaryView === 'None') return null;
          const profile = datasetProfiles[activeDatasetMeta.id];
          const viewConfig = profile?.views?.[primaryView];
          if (viewConfig?.renderType === 'scalarSurface') {
            return <SurfaceDataLayer />;
          }
          return null;
        })()}
        <VectorLayer />
      </ErrorBoundary>
      <ObservationMarkers />
    </Canvas>
    <ScientificLegend />
    </>
  );
}
