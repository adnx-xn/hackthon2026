import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppContext';

export default function ScientificLegend() {
  const { primaryView, surfaceData, activeDatasetMeta } = useAppState();

  // Determine what to show based on the primary view
  const config = useMemo(() => {
    if (primaryView === 'None') return null;

    if (primaryView === 'Currents') {
      // Vectors don't use colormap right now, just white arrows scaled. 
      // We can just show a static label.
      return {
        label: 'Current Speed',
        units: 'm/s',
        min: 0,
        max: 'varies',
        showGradient: false
      };
    }

    if (!surfaceData) return null;

    const { valueMin, valueMax, units } = surfaceData;
    let label = primaryView;
    if (primaryView === 'Temperature') label = 'Temperature';
    if (primaryView === 'Salinity') label = 'Salinity';
    if (primaryView === 'Depth') label = 'Depth';

    return {
      label,
      units: units || '',
      min: valueMin,
      max: valueMax,
      showGradient: true
    };
  }, [primaryView, surfaceData]);

  if (!config) return null;

  // Render a CSS gradient string for the default 'viridis' colormap
  // The actual colormapPalette is in AppContext, but we can hardcode the default for simplicity 
  // or build a gradient from the COLORMAPS utility.
  
  // For V1, a simple continuous gradient representing viridis:
  const gradientStr = `linear-gradient(to top, 
    rgb(68, 1, 84), 
    rgb(59, 82, 139), 
    rgb(33, 145, 140), 
    rgb(94, 201, 98), 
    rgb(253, 231, 37)
  )`;

  return (
    <div style={{
      position: 'absolute',
      bottom: '30px',
      left: '30px',
      background: 'rgba(10, 10, 26, 0.8)',
      padding: '15px',
      borderRadius: '8px',
      color: 'white',
      fontFamily: 'sans-serif',
      border: '1px solid #333',
      zIndex: 1000,
      minWidth: '120px'
    }}>
      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>
        {config.label} {config.units ? `(${config.units})` : ''}
      </div>
      
      {config.showGradient ? (
        <div style={{ display: 'flex', alignItems: 'center', height: '150px' }}>
          <div style={{
            width: '20px',
            height: '100%',
            background: gradientStr,
            marginRight: '10px',
            borderRadius: '4px'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', fontSize: '12px' }}>
            <div>{typeof config.max === 'number' ? config.max.toFixed(2) : config.max}</div>
            <div>{typeof config.min === 'number' ? config.min.toFixed(2) : config.min}</div>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: '#aaa' }}>
          Vector display
        </div>
      )}
    </div>
  );
}
