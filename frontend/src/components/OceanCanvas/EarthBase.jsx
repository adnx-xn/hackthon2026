import React from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { EARTH_RADIUS } from '../../utils/sceneCoords';

export default function EarthBase() {
  const earthTexture = useLoader(THREE.TextureLoader, '/assets/earth/earth_atmos_2048.jpg');

  return (
    <group>
      <mesh rotation={[0, -Math.PI /2, 0]}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshBasicMaterial map={earthTexture} />
      </mesh>
    </group>
  );
}
