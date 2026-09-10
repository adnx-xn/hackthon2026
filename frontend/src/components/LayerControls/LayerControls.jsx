import React from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';

export default function LayerControls() {
  const state = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col gap-[10px]">
      <h4>Layer Visibility</h4>
      
      <div>
        <label>
          <input 
            type="checkbox" 
            checked={state.showCurrentVectors}
            onChange={(e) => dispatch({ type: 'TOGGLE_VECTORS', payload: e.target.checked })}
            className="accent-[#38bdf8] w-[15px] h-[15px] cursor-pointer"
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
              className="accent-[#38bdf8] w-[15px] h-[15px] cursor-pointer"
            />
            {' '}{layer.toUpperCase().replace('_', ' ')} Markers
          </label>
        </div>
      ))}

      <div className="mt-[10px]">
        <label>Model Layer Opacity ({state.layerOpacity.toFixed(2)}): </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05"
          value={state.layerOpacity}
          onChange={(e) => dispatch({ type: 'SET_LAYER_OPACITY', payload: parseFloat(e.target.value) })}
          className="appearance-none w-full h-[4px] p-0 border-none rounded-[10px] bg-[linear-gradient(90deg,rgba(56,189,248,0.75),rgba(30,64,175,0.4))] cursor-pointer"
        />
      </div>
    </div>
  );
}
