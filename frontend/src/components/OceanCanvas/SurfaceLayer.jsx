import React from 'react';
import { EARTH_RADIUS } from '../../utils/sceneCoords';

export default function SurfaceLayer() {
  return (
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
      <meshBasicMaterial 
        color="#006699" 
        transparent={true} 
        opacity={0.4}
        depthWrite={false}
      />
    </mesh>
  );
}
