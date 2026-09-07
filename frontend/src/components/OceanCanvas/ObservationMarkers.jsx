import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { geoToScene } from '../../utils/sceneCoords';

const MARKER_CONFIG = {
  argo: { color: 0xffaa00, size: 3 },
  glider: { color: 0x00ffcc, size: 4 },
  ctd: { color: 0xff00ff, size: 3.5 },
  bgc: { color: 0x00ff00, size: 3.5 },
  mooring: { color: 0xff0000, size: 5 }
};

export default function ObservationMarkers() {
  const { instruments, obsLayerVisibility, verticalExaggeration } = useAppState();
  const dispatch = useAppDispatch();
  const { raycaster } = useThree();
  
  const pointsRefs = useRef({});
  const vectorsGroupRef = useRef();
  
  // Set explicit threshold for raycasting on Points (AGENTS.md §3.9)
  useEffect(() => {
    raycaster.params.Points.threshold = 1.5; 
  }, [raycaster]);

  // Group instruments by type
  const groupedInstruments = React.useMemo(() => {
    const groups = { argo: [], glider: [], ctd: [], bgc: [], mooring: [], hf_radar: [], adcp: [] };
    (instruments || []).forEach(inst => {
      if (groups[inst.instrument_type]) {
        groups[inst.instrument_type].push(inst);
      }
    });
    return groups;
  }, [instruments]);

  // Handle Point Geometry updates
  useEffect(() => {
    Object.keys(MARKER_CONFIG).forEach(type => {
      const ref = pointsRefs.current[type];
      if (ref) {
        if (ref.geometry) ref.geometry.dispose();
        
        const insts = groupedInstruments[type];
        if (insts && insts.length > 0) {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(insts.length * 3);
          insts.forEach((inst, i) => {
            const pos = geoToScene(inst.lon, 0, inst.lat, verticalExaggeration);
            positions[i * 3] = pos.x;
            positions[i * 3 + 1] = pos.y + 0.5;
            positions[i * 3 + 2] = pos.z;
          });
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          ref.geometry = geometry;
        }
      }
    });
  }, [groupedInstruments, verticalExaggeration]);

  // Handle Vector updates (HF-Radar, ADCP)
  useEffect(() => {
    const group = vectorsGroupRef.current;
    if (!group) return;
    
    // Clear existing arrows
    group.children.forEach(child => {
      if (child instanceof THREE.ArrowHelper) {
        if (child.line.geometry) child.line.geometry.dispose();
        if (child.line.material) child.line.material.dispose();
        if (child.cone.geometry) child.cone.geometry.dispose();
        if (child.cone.material) child.cone.material.dispose();
      }
    });
    group.clear();

    const renderVectors = (insts, type) => {
      if (!obsLayerVisibility[type]) return;
      
      const color = type === 'hf_radar' ? 0xffff00 : 0x00ccff;
      const arrowLengthScale = 2.0;
      // Default max speed for scaling arrows if we don't have a dataset max
      const speed_max = 1.0; 
      
      insts.forEach((inst, idx) => {
        // HF-Radar has scalar u, v, depth. ADCP has arrays u, v, depth.
        const u_arr = Array.isArray(inst.u) ? inst.u : [inst.u];
        const v_arr = Array.isArray(inst.v) ? inst.v : [inst.v];
        const d_arr = Array.isArray(inst.depth) ? inst.depth : [inst.depth || 0];

        for (let i = 0; i < u_arr.length; i++) {
          const u_val = u_arr[i];
          const v_val = v_arr[i];
          const depth_val = d_arr[i];

          if (u_val === null || v_val === null || u_val === undefined) continue;

          const speed = Math.sqrt(u_val * u_val + v_val * v_val);
          if (speed < 1e-10) continue;

          const dir = new THREE.Vector3(u_val, 0, v_val).normalize();
          const pos = geoToScene(inst.lon, depth_val, inst.lat, verticalExaggeration);
          const origin = new THREE.Vector3(pos.x, pos.y, pos.z);
          
          const length = (speed / speed_max) * arrowLengthScale;
          if (length > 0) {
            const arrowHelper = new THREE.ArrowHelper(dir, origin, length, color, 0.2 * length, 0.1 * length);
            
            // Allow raycasting by attaching data to arrow (optional, arrows are tricky to raycast, but we can try)
            arrowHelper.userData = { id: inst.id, type: inst.instrument_type, index: idx };
            group.add(arrowHelper);
          }
        }
      });
    };

    renderVectors(groupedInstruments.hf_radar, 'hf_radar');
    renderVectors(groupedInstruments.adcp, 'adcp');
    
  }, [groupedInstruments, obsLayerVisibility, verticalExaggeration]);

  // Handle cleanup
  useEffect(() => {
    const refs = pointsRefs.current;
    const vGroup = vectorsGroupRef.current;
    return () => {
      Object.values(refs).forEach(ref => {
        if (ref) {
          if (ref.geometry) ref.geometry.dispose();
          if (ref.material) ref.material.dispose();
        }
      });
      if (vGroup) {
        vGroup.children.forEach(child => {
          if (child instanceof THREE.ArrowHelper) {
            if (child.line.geometry) child.line.geometry.dispose();
            if (child.line.material) child.line.material.dispose();
            if (child.cone.geometry) child.cone.geometry.dispose();
            if (child.cone.material) child.cone.material.dispose();
          }
        });
        vGroup.clear();
      }
    };
  }, []);

  const handleClick = (e, type) => {
    e.stopPropagation();
    if (e.index !== undefined && groupedInstruments[type] && groupedInstruments[type][e.index]) {
      dispatch({ type: 'SET_SELECTED_INSTRUMENT', payload: groupedInstruments[type][e.index].id });
    }
  };

  return (
    <group>
      {Object.entries(MARKER_CONFIG).map(([type, config]) => (
        groupedInstruments[type] && groupedInstruments[type].length > 0 && (
          <points 
            key={type}
            ref={el => pointsRefs.current[type] = el} 
            visible={obsLayerVisibility[type]} 
            onClick={(e) => handleClick(e, type)}
          >
            <pointsMaterial 
              size={config.size} 
              color={config.color} 
              sizeAttenuation={false}
              depthTest={false} 
            />
          </points>
        )
      ))}
      <group ref={vectorsGroupRef} />
    </group>
  );
}
