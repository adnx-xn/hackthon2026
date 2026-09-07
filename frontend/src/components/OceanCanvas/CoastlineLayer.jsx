import React, { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { geoToSpherical, EARTH_RADIUS } from '../../utils/sceneCoords';

// Slightly elevate the coastline radius to prevent Z-fighting with the Earth sphere
const COASTLINE_RADIUS = EARTH_RADIUS * 1.001;

export default function CoastlineLayer() {
  const [geoJson, setGeoJson] = useState(null);

  useEffect(() => {
    let active = true;
    fetch('/assets/earth/coastline.geojson')
      .then(res => res.json())
      .then(data => {
        if (active) setGeoJson(data);
      })
      .catch(err => console.error("Failed to load coastline.geojson:", err));

    return () => { active = false; };
  }, []);

  const geometry = useMemo(() => {
    if (!geoJson) return null;

    const vertices = [];

    // Helper to process a single LineString (array of [lon, lat] coordinates)
    const processLineString = (coords) => {
      for (let i = 0; i < coords.length - 1; i++) {
        const [lon1, lat1] = coords[i];
        const [lon2, lat2] = coords[i + 1];

        const p1 = geoToSpherical(lon1, lat1, 0, 1);
        const p2 = geoToSpherical(lon2, lat2, 0, 1);

        // Manually scale to coastline radius instead of EARTH_RADIUS to prevent Z-fighting
        const scale = COASTLINE_RADIUS / EARTH_RADIUS;

        vertices.push(p1.x * scale, p1.y * scale, p1.z * scale);
        vertices.push(p2.x * scale, p2.y * scale, p2.z * scale);
      }
    };

    if (geoJson.type === 'FeatureCollection' && geoJson.features) {
      geoJson.features.forEach(feature => {
        const geom = feature.geometry;
        if (!geom) return;

        if (geom.type === 'LineString') {
          processLineString(geom.coordinates);
        } else if (geom.type === 'MultiLineString') {
          geom.coordinates.forEach(lineCoords => processLineString(lineCoords));
        } else if (geom.type === 'Polygon') {
          geom.coordinates.forEach(ringCoords => processLineString(ringCoords));
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(polyCoords => {
            polyCoords.forEach(ringCoords => processLineString(ringCoords));
          });
        }
      });
    }

    const bufGeom = new THREE.BufferGeometry();
    bufGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return bufGeom;
  }, [geoJson]);

  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#ffffff" opacity={0.4} transparent={true} />
    </lineSegments>
  );
}
