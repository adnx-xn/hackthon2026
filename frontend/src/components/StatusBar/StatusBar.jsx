import React from 'react';
import { useAppState } from '../../context/AppContext';

export default function StatusBar() {
  const state = useAppState();

  const datasetName = state.activeDatasetMeta ? state.activeDatasetMeta.name : 'None';
  const variable = state.activeVariable || 'None';
  
  const depth = state.depths.length > 0 && state.activeDepthIndex < state.depths.length 
    ? `${state.depths[state.activeDepthIndex]}m` 
    : '0m';
    
  const time = state.times.length > 0 && state.activeTimeIndex < state.times.length
    ? state.times[state.activeTimeIndex]
    : 'T0';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: '#181717ff', color: '#ccc', fontSize: '14px', borderTop: '1px solid #333', width: '100%', boxSizing: 'border-box' }}>
      <div>
        <strong>Dataset:</strong> {datasetName} &nbsp;|&nbsp; 
        <strong> Variable:</strong> {variable} &nbsp;|&nbsp; 
        <strong> Depth:</strong> {depth} &nbsp;|&nbsp; 
        <strong> Time:</strong> {time}
      </div>
      <div>
        {state.isLoading ? <span style={{ color: '#00ffcc' }}>Loading data...</span> : <span>Ready</span>}
      </div>
    </div>
  );
}
