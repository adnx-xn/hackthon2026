import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { EARTH_RADIUS } from '../../utils/sceneCoords';

export default function EarthBase() {
  const earthTexture = useLoader(THREE.TextureLoader, '/assets/earth/earth_atmos_2048.jpg');

  const starGeometry = useMemo(() => {
    const starCount = 2000;
    const pos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      // Create a large 3D volume from radius 45000 to 90000, well outside the camera's max distance
      const r = 45000 + Math.random() * 90000; 
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      starGeometry.dispose();
    };
  }, [starGeometry]);

  return (
    <group>
      {/* Deep-space 3D starfield surrounding the Earth */}
      <points geometry={starGeometry}>
        <pointsMaterial color={0xffffff} size={400} sizeAttenuation={true} transparent={true} opacity={0.3} depthWrite={false} />
      </points>

      {/* Ambient light ensures the Earth texture remains fully visible without a directional light */}
      <ambientLight intensity={3} color="#ffffffff" />

      {/* Main Earth Sphere */}
      <mesh rotation={[0, -Math.PI / 2, 0]}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <meshStandardMaterial 
          map={earthTexture} 
          roughness={1} 
          metalness={0} 
        />
      </mesh>
    </group>
  );
}
