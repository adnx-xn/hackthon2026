import * as THREE from 'three';
import { getColormapColor } from './colormap';

/**
 * Generates a 1D THREE.DataTexture for a given colormap palette.
 * This texture can be passed as a uniform to the volume ray-marching shader.
 * 
 * @param {string} paletteName - The name of the palette (e.g., 'viridis')
 * @param {number} resolution - The number of colors in the gradient (default 256)
 * @returns {THREE.DataTexture} The generated 1D texture
 */
export function createColormapTexture(paletteName = 'viridis', resolution = 256) {
  const data = new Uint8Array(resolution * 4);
  
  for (let i = 0; i < resolution; i++) {
    // Map i from [0, resolution - 1] to [0, 1]
    const t = i / (resolution - 1);
    
    // We can use getColormapColor with min=0, max=1 to get the exact color
    const color = getColormapColor(t, 0, 1, 'linear', paletteName);
    
    if (color) {
      data[i * 4] = Math.floor(color.r * 255);
      data[i * 4 + 1] = Math.floor(color.g * 255);
      data[i * 4 + 2] = Math.floor(color.b * 255);
      data[i * 4 + 3] = 255; // Fully opaque color mapping
    } else {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 0;
    }
  }

  const texture = new THREE.DataTexture(data, resolution, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  
  // Use linear interpolation to make the gradient smooth
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  
  // Prevent wrapping 
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  
  return texture;
}
