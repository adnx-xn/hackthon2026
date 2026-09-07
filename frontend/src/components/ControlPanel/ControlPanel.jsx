import React, { useEffect, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../../context/AppContext';
import { 
  listDatasets, getDataset, getDataSlice,
  listObservations, getInstruments, getProfile 
} from '../../api/apiClient';
import { useAnimation } from '../../hooks/useAnimation';
import ColormapWidget from '../ColormapWidget/ColormapWidget';
import LayerControls from '../LayerControls/LayerControls';
import ProfilePanel from '../ProfilePanel/ProfilePanel';
import datasetProfiles from '../../config/datasetProfiles.json';

export default function ControlPanel() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { isAnimating, startAnimation, stopAnimation, fetchFrame } = useAnimation();

  // Combine actual datasets from backend with planned datasets from configuration
  const allDatasets = useMemo(() => {
    const backendDatasets = state.availableDatasets || [];
    const backendDatasetIds = new Set(backendDatasets.map(d => d.id));
    
    const combined = [...backendDatasets];
    
    for (const [id, profile] of Object.entries(datasetProfiles)) {
      if (!backendDatasetIds.has(id)) {
        combined.push({
          id,
          name: profile.displayName || id,
          status: 'planned'
        });
      }
    }
    return combined;
  }, [state.availableDatasets]);

  // Compute view statuses dynamically
  const viewStatuses = useMemo(() => {
    const vars = state.variables || [];
    const profile = datasetProfiles[state.activeDatasetId];
    
    if (!profile || !profile.views) return {};

    const statuses = {};
    for (const [viewName, config] of Object.entries(profile.views)) {
      if (config.status === 'planned') {
        statuses[viewName] = { isAvailable: false, reason: 'Coming soon' };
        continue;
      }
      
      let hasVars = false;
      if (config.renderType === 'surfaceVectors') {
        hasVars = vars.includes(config.uVariable) && vars.includes(config.vVariable);
      } else {
        hasVars = vars.includes(config.variable);
      }

      if (hasVars) {
        statuses[viewName] = { isAvailable: true, reason: '' };
      } else {
        statuses[viewName] = { isAvailable: false, reason: 'Not available' };
      }
    }
    return statuses;
  }, [state.variables, state.activeDatasetId]);

  // 1. Initial Load: Model and Observation Datasets
  useEffect(() => {
    let active = true;
    
    const fetchInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      try {
        const [models, obs] = await Promise.all([
          listDatasets(),
          listObservations().catch(() => []) // Graceful fail if no obs
        ]);
        
        if (active) {
          dispatch({ type: 'SET_AVAILABLE_DATASETS', payload: models });
          dispatch({ type: 'SET_AVAILABLE_OBSERVATIONS', payload: obs });
          
          if (models.length > 0) {
            handleDatasetSelect(models[0].id); // Auto-select first model
          }
        }
      } catch (err) {
        if (active) dispatch({ type: 'SET_ERROR', payload: err });
      } finally {
        if (active) dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    fetchInitialData();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Fetch full metadata when active model dataset changes
  const handleDatasetSelect = async (datasetId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const meta = await getDataset(datasetId);
      dispatch({ 
        type: 'SET_ACTIVE_DATASET', 
        payload: {
          id: datasetId,
          meta: meta,
          variables: meta.variables,
          depths: meta.depth_levels || [],
          times: meta.time_steps || []
        }
      });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update activeVariable when primaryView changes based on Profile
  useEffect(() => {
    let targetVar = null;
    
    if (state.primaryView !== 'None' && state.primaryView !== 'Currents' && state.activeDatasetId) {
      const profile = datasetProfiles[state.activeDatasetId];
      if (profile && profile.views && profile.views[state.primaryView]) {
        targetVar = profile.views[state.primaryView].variable;
      }
    }
    
    dispatch({ type: 'SET_ACTIVE_VARIABLE', payload: targetVar || null });
  }, [state.primaryView, state.activeDatasetId, dispatch]);

  // 3. Fetch Surface Data when active parameters change
  useEffect(() => {
    let active = true;
    
    // Only fetch if a valid variable is set and we're not animating
    if (!state.activeDatasetId || !state.activeVariable || state.isAnimating) return;
    
    const status = viewStatuses[state.primaryView];
    if (!status || !status.isAvailable) return;

    fetchFrame(state.activeTimeIndex);
    
    return () => { active = false; };
  }, [state.activeDatasetId, state.activeVariable, state.primaryView, state.isAnimating, viewStatuses, fetchFrame]);

  // 4. Fetch Instruments when active observation dataset changes
  const handleObsDatasetSelect = async (datasetId) => {
    dispatch({ type: 'SET_ACTIVE_OBS_DATASET', payload: datasetId });
    if (!datasetId) {
      dispatch({ type: 'SET_INSTRUMENTS', payload: [] });
      return;
    }
    
    try {
      const insts = await getInstruments(datasetId);
      dispatch({ type: 'SET_INSTRUMENTS', payload: insts });
    } catch (err) {
      console.error("Failed to fetch instruments:", err);
    }
  };

  // 5. Fetch Profile when instrument is selected
  useEffect(() => {
    let active = true;
    
    const fetchProf = async () => {
      if (!state.activeObsDatasetId || !state.selectedInstrumentId) return;
      
      try {
        const prof = await getProfile(state.activeObsDatasetId, state.selectedInstrumentId);
        if (active) dispatch({ type: 'SET_PROFILE_DATA', payload: prof });
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    
    fetchProf();
    return () => { active = false; };
  }, [state.activeObsDatasetId, state.selectedInstrumentId, dispatch]);

  const profile = datasetProfiles[state.activeDatasetId];
  const viewConfig = profile?.views?.[state.primaryView];
  const showDataControls = viewConfig && viewConfig.renderType === 'scalarSurface' && viewStatuses[state.primaryView]?.isAvailable;
  const showVectorControls = state.primaryView === 'Currents' && viewStatuses[state.primaryView]?.isAvailable;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h3>Controls</h3>

      {/* Model Dataset Selector */}
      <div>
        <label>Model Dataset: </label>
        <select 
          value={state.activeDatasetId || ''} 
          onChange={(e) => handleDatasetSelect(e.target.value)}
          disabled={state.isLoading}
        >
          {allDatasets.length === 0 && !state.isLoading && <option value="">No datasets available</option>}
          {allDatasets.length === 0 && state.isLoading && <option value="">Loading datasets...</option>}
          {allDatasets.map(d => {
            const isPlanned = d.status === 'planned';
            return (
              <option key={d.id} value={d.id} disabled={isPlanned}>
                {d.name || d.id} {isPlanned ? '(Coming soon)' : ''}
              </option>
            );
          })}
        </select>
        
        {!profile && state.activeDatasetId && (
          <div style={{ color: '#ffaa00', fontSize: '0.85em', marginTop: '5px' }}>
            This dataset does not yet have a visualization profile.
          </div>
        )}
      </div>
      
      <hr style={{ margin: '5px 0', borderColor: '#333' }} />

      {/* PRIMARY SELECTOR: What do you want to see? */}
      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          WHAT DO YOU WANT TO SEE?
        </label>
        <select 
          value={state.primaryView} 
          onChange={(e) => dispatch({ type: 'SET_PRIMARY_VIEW', payload: e.target.value })}
          disabled={!state.activeDatasetId || !profile}
        >
          <option value="None">None (Earth Only)</option>
          
          {profile && profile.views && Object.entries(profile.views).map(([viewName, config]) => {
            const status = viewStatuses[viewName];
            if (!status) return null;
            return (
              <option key={viewName} value={viewName} disabled={!status.isAvailable}>
                {config.label} {!status.isAvailable ? `(${status.reason})` : ''}
              </option>
            );
          })}
        </select>
      </div>

      <hr style={{ margin: '5px 0', borderColor: '#333' }} />
      
      {/* Time Controls (shown if time length > 1 and a relevant view is selected) */}
      {(showDataControls || showVectorControls) && state.times.length > 1 && (
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            TIME CONTROLS
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={() => fetchFrame(Math.max(0, state.activeTimeIndex - 1))}
              disabled={state.activeTimeIndex === 0 || state.isAnimating}
            >
              ◀ Prev
            </button>
            <button 
              onClick={startAnimation} 
              disabled={state.isAnimating}
              style={{ fontWeight: state.isAnimating ? 'bold' : 'normal', background: state.isAnimating ? '#d4edda' : undefined }}
            >
              DYNAMIC
            </button>
            <button 
              onClick={stopAnimation} 
              disabled={!state.isAnimating}
              style={{ fontWeight: !state.isAnimating ? 'bold' : 'normal', background: !state.isAnimating ? '#f8d7da' : undefined }}
            >
              STATIC
            </button>
            <button 
              onClick={() => fetchFrame(Math.min(state.times.length - 1, state.activeTimeIndex + 1))}
              disabled={state.activeTimeIndex === state.times.length - 1 || state.isAnimating}
            >
              Next ▶
            </button>
          </div>
          
          <div style={{ fontSize: '0.9em', marginBottom: '5px' }}>
            <strong>Frame:</strong> {state.activeTimeIndex + 1} / {state.times.length}
          </div>
          <div style={{ fontSize: '0.9em', marginBottom: '10px' }}>
            <strong>Time:</strong> {state.times[state.activeTimeIndex]}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '0.9em' }}>Speed:</label>
            <input 
              type="range" 
              min="0.5" 
              max="5" 
              step="0.5" 
              value={state.animationSpeed || 1}
              onChange={(e) => dispatch({ type: 'SET_ANIMATION_SPEED', payload: parseFloat(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.9em' }}>{state.animationSpeed || 1}x</span>
          </div>
        </div>
      )}

      {/* Colormap Controls for scalar data fields */}
      {showDataControls && (
        <>
          <hr />
          <ColormapWidget />
        </>
      )}

      <hr />
      
      {/* Observations Selector */}
      <div>
        <label>Obs Dataset: </label>
        <select 
          value={state.activeObsDatasetId || ''} 
          onChange={(e) => handleObsDatasetSelect(e.target.value)}
        >
          <option value="">None selected</option>
          {state.availableObservations.map(d => (
            <option key={d.id} value={d.id}>{d.name || d.id}</option>
          ))}
        </select>
      </div>

      <ProfilePanel />
      
      <hr />
      <LayerControls />
    </div>
  );
}
