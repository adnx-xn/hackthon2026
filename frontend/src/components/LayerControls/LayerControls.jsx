import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';

export default function LayerControls() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h4>Layer Visibility</h4>
      
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={state.showCurrentVectors}
            onChange={(e) => dispatch({ type: 'TOGGLE_VECTORS', payload: e.target.checked })}
          />
          {' '}Current Vectors (if available)
        </label>
      </div>

      {Object.entries(state.obsLayerVisibility).map(([layer, visible]) => (
        <div key={layer}>
          <label>
            <input 
              type="checkbox" 
              checked={visible}
              onChange={(e) => dispatch({ 
                type: 'TOGGLE_OBS_LAYER', 
                payload: { layer, visible: e.target.checked } 
              })}
            />
            {' '}{layer.toUpperCase().replace('_', ' ')} Markers
          </label>
        </div>
      ))}

      <div style={{ marginTop: '10px' }}>
        <label>Model Layer Opacity ({state.layerOpacity.toFixed(2)}): </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05"
          value={state.layerOpacity}
          onChange={(e) => dispatch({ type: 'SET_LAYER_OPACITY', payload: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  );
}
