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
    <div className="flex justify-between py-[10px] px-[20px] bg-[#030f1dfa] text-[#ccc] text-[14px] border-t border-[#333] w-full box-border">
      <div>
        <strong>Dataset:</strong> {datasetName} &nbsp;|&nbsp; 
        <strong> Variable:</strong> {variable} &nbsp;|&nbsp; 
        <strong> Depth:</strong> {depth} &nbsp;|&nbsp; 
        <strong> Time:</strong> {time}
      </div>
      <div>
        {state.isLoading ? <span className="text-[#00ffcc]">Loading data...</span> : <span>Ready</span>}
      </div>
    </div>  
  );
}