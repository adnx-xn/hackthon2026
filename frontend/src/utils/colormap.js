import * as THREE from 'three';

// Basic Viridis palette approximation
export const VIRIDIS = [
  new THREE.Color(0x440154),
  new THREE.Color(0x482878),
  new THREE.Color(0x3e4a89),
  new THREE.Color(0x31688e),
  new THREE.Color(0x26828e),
  new THREE.Color(0x1f9e89),
  new THREE.Color(0x35b779),
  new THREE.Color(0x6ece58),
  new THREE.Color(0xb5de2b),
  new THREE.Color(0xfde725)
];

// Plasma palette
export const PLASMA = [
  new THREE.Color(0x0d0887),
  new THREE.Color(0x46039f),
  new THREE.Color(0x7201a8),
  new THREE.Color(0x9c179e),
  new THREE.Color(0xbd3786),
  new THREE.Color(0xd8576b),
  new THREE.Color(0xed7953),
  new THREE.Color(0xfb9f3a),
  new THREE.Color(0xfdc926),
  new THREE.Color(0xf0f921)
];

// Coolwarm palette
export const COOLWARM = [
  new THREE.Color(0x3b4cc0),
  new THREE.Color(0x6788ee),
  new THREE.Color(0x9ebbff),
  new THREE.Color(0xc9d7f0),
  new THREE.Color(0xedd1c2),
  new THREE.Color(0xf7a889),
  new THREE.Color(0xe26952),
  new THREE.Color(0xb40426)
];

// Jet palette
export const JET = [
  new THREE.Color(0x00007f),
  new THREE.Color(0x0000ff),
  new THREE.Color(0x007fff),
  new THREE.Color(0x00ffff),
  new THREE.Color(0x7fff7f),
  new THREE.Color(0xffff00),
  new THREE.Color(0xff7f00),
  new THREE.Color(0xff0000),
  new THREE.Color(0x7f0000)
];

export const PALETTES = {
  viridis: VIRIDIS,
  plasma: PLASMA,
  coolwarm: COOLWARM,
  jet: JET
};

/**
 * Gets a color from an array of colors based on a normalized value [0,1].
 * @param {number} t - Normalized value between 0 and 1
 * @param {Array<THREE.Color>} palette - Array of THREE.Color
 * @returns {THREE.Color} Interpolated color
 */
function getColorFromArray(t, palette) {
  if (!palette || palette.length === 0) return new THREE.Color(0x000000);
  if (palette.length === 1) return palette[0].clone();
  
  const clampedT = Math.max(0, Math.min(1, t));
  if (clampedT === 1) return palette[palette.length - 1].clone();
  
  const scaled = clampedT * (palette.length - 1);
  const index = Math.floor(scaled);
  const fraction = scaled - index;
  
  const c1 = palette[index];
  const c2 = palette[index + 1];
  
  return c1.clone().lerp(c2, fraction);
}

/**
 * Gets a color from a custom gradient defined by color stops.
 * @param {number} t - Normalized value between 0 and 1
 * @param {Array<{position: number, color: THREE.Color}>} stops - Sorted array of color stops
 * @returns {THREE.Color} Interpolated color
 */
function getColorFromStops(t, stops) {
  if (!stops || stops.length === 0) return new THREE.Color(0x000000);
  if (stops.length === 1) return stops[0].color.clone();
  
  const clampedT = Math.max(0, Math.min(1, t));
  
  // Find the segment t falls into
  let lowerStop = stops[0];
  let upperStop = stops[stops.length - 1];
  
  if (clampedT <= lowerStop.position) return lowerStop.color.clone();
  if (clampedT >= upperStop.position) return upperStop.color.clone();
  
  for (let i = 0; i < stops.length - 1; i++) {
    if (clampedT >= stops[i].position && clampedT <= stops[i+1].position) {
      lowerStop = stops[i];
      upperStop = stops[i+1];
      break;
    }
  }
  
  const range = upperStop.position - lowerStop.position;
  if (range <= 0) return lowerStop.color.clone();
  
  const fraction = (clampedT - lowerStop.position) / range;
  return lowerStop.color.clone().lerp(upperStop.color, fraction);
}

/**
 * Normalizes a value and maps it to a color, following strict scientific rules.
 * 
 * @param {number} value - The actual data value
 * @param {number} min - The minimum of the colormap scale
 * @param {number} max - The maximum of the colormap scale
 * @param {string} scaleType - 'linear' or 'log'
 * @param {string|Array} paletteOrStops - Name of palette OR array of custom color stops
 * @returns {THREE.Color | null} The mapped color, or null if value is invalid/missing
 */
export function getColormapColor(value, min, max, scaleType = 'linear', paletteOrStops = 'viridis') {
  // AGENTS.md §3.7: Filter null / undefined / NaN values before calculation
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  
  // Handle Infinity and -Infinity safely
  if (!Number.isFinite(value)) {
    return null;
  }

  let t = 0;
  
  // AGENTS.md §3.7: Handle max === min without division by zero — return the midpoint
  if (max === min) {
    t = 0.5;
  } else if (scaleType === 'log') {
    // AGENTS.md §3.7: Log scale rules
    if (min > 0 && value > 0) {
      const logVal = Math.log(value);
      const logMin = Math.log(min);
      const logMax = Math.log(max);
      t = (logVal - logMin) / (logMax - logMin);
    } else {
      console.warn("Colormap warning: Log scale requested but min <= 0 or value <= 0. Falling back to linear.");
      t = (value - min) / (max - min);
    }
  } else {
    t = (value - min) / (max - min);
  }
  
  // AGENTS.md §3.7: Clamp t to [0, 1] after normalization
  t = Math.max(0, Math.min(1, t));

  if (Array.isArray(paletteOrStops)) {
    // It's a custom stops array: [{ position: 0.0, color: THREE.Color }, ...]
    return getColorFromStops(t, paletteOrStops);
  } else {
    // It's a palette name
    const paletteArray = PALETTES[paletteOrStops] || VIRIDIS;
    return getColorFromArray(t, paletteArray);
  }
}
