/**
 * sceneCoords.js
 * 
 * Authoritative coordinate transformations from geographic space to Three.js scene space.
 * As per architectural rules, do not duplicate these formulas elsewhere.
 */

/**
 * Converts longitude to scene X coordinate.
 * Maps directly 1:1.
 * 
 * @param {number} longitude - Longitude in degrees (-180 to 180)
 * @returns {number} Scene X coordinate
 */
export const toSceneX = (longitude) => {
  return longitude;
};

/**
 * Converts depth to scene Y coordinate.
 * Y = -depth * verticalExaggeration
 * 
 * @param {number} depthMeters - Depth in meters (positive down)
 * @param {number} verticalExaggeration - Scaling factor
 * @returns {number} Scene Y coordinate (inverted)
 */
export const toSceneY = (depthMeters, verticalExaggeration) => {
  return -depthMeters * verticalExaggeration;
};

/**
 * Converts latitude to scene Z coordinate.
 * Maps directly 1:1.
 * 
 * @param {number} latitude - Latitude in degrees (-90 to 90)
 * @returns {number} Scene Z coordinate
 */
export const toSceneZ = (latitude) => {
  return latitude;
};

/**
 * Converts geographic coordinates to a scene position object.
 * 
 * @param {number} longitude - Longitude in degrees
 * @param {number} depthMeters - Depth in meters
 * @param {number} latitude - Latitude in degrees
 * @param {number} verticalExaggeration - Scaling factor for depth
 * @returns {{x: number, y: number, z: number}} Scene position
 */
export const geoToScene = (longitude, depthMeters, latitude, verticalExaggeration) => {
  return {
    x: toSceneX(longitude),
    y: toSceneY(depthMeters, verticalExaggeration),
    z: toSceneZ(latitude)
  };
};

export const EARTH_RADIUS = 5000;
export const DEPTH_SCALE = 0.01;

/**
 * Converts longitude, latitude, and depth to spherical 3D coordinates.
 * Coordinate convention:
 * X = East/West
 * Y = North/South vertical globe axis
 * Z = longitude depth axis according to the spherical mapping
 * 
 * longitude = 0, latitude = 0 maps to positive X direction.
 * 
 * @param {number} longitude - Longitude in degrees
 * @param {number} latitude - Latitude in degrees
 * @param {number} depthMeters - Depth in meters (positive down)
 * @param {number} verticalExaggeration - Scaling factor
 * @returns {{x: number, y: number, z: number}} Scene position
 */
export function geoToSpherical(longitude, latitude, depthMeters = 0, verticalExaggeration = 1) {
  const lonRad = (longitude * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;

  const depthOffset = depthMeters * DEPTH_SCALE * verticalExaggeration;
  const R = EARTH_RADIUS - depthOffset;
  
  const x = R * Math.cos(latRad) * Math.cos(lonRad);
  const y = R * Math.sin(latRad);
  const z = R * Math.cos(latRad) * Math.sin(lonRad);

  return { x, y, z };
}
