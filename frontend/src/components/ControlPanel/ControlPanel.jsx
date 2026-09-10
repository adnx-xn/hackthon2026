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
    <div className="ocean-panel-root">
      <style>{`
        .ocean-panel-root {
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Genuine Glassmorphic Card System with Specular Highlights */
        .ocean-card {
          background: linear-gradient(
            135deg,
            rgba(16, 44, 82, 0.45) 0%,
            rgba(8, 28, 56, 0.35) 45%,
            rgba(4, 18, 38, 0.55) 100%
          ) !important;
          border: 1px solid rgba(56, 189, 248, 0.2) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 16px !important;
          padding: 16px 18px !important;
          box-shadow: 
            0 12px 36px 0 rgba(0, 6, 22, 0.45),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.16),
            inset 0 -1px 2px 0 rgba(0, 0, 0, 0.3) !important;
          backdrop-filter: blur(24px) saturate(190%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(190%) !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 14px !important;
          position: relative !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .ocean-card:hover {
          background: linear-gradient(
            135deg,
            rgba(20, 52, 96, 0.52) 0%,
            rgba(10, 34, 66, 0.42) 45%,
            rgba(5, 22, 46, 0.62) 100%
          ) !important;
          border-color: rgba(56, 189, 248, 0.35) !important;
          border-top-color: rgba(255, 255, 255, 0.32) !important;
          box-shadow: 
            0 16px 42px 0 rgba(0, 8, 30, 0.55),
            inset 0 1px 2px 0 rgba(255, 255, 255, 0.22),
            inset 0 -1px 2px 0 rgba(0, 0, 0, 0.3) !important;
        }

        .ocean-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 11px;
          border-bottom: 1px solid rgba(56, 189, 248, 0.12);
        }

        .ocean-card-title {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #f1f5f9;
          text-transform: uppercase;
        }

        .ocean-ctrl-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .ocean-ctrl-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.73rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          color: #94a3b8;
        }

        .ocean-ctrl-label-prominent {
          color: #38bdf8;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .ocean-select-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .ocean-select-icon-left {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #38bdf8;
          pointer-events: none;
          z-index: 3;
          opacity: 0.95;
        }

        .ocean-select-icon-right {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          pointer-events: none;
          z-index: 3;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .ocean-select-wrap:hover .ocean-select-icon-right {
          color: #38bdf8;
        }

        /* Glassmorphic Dropdowns with Translucency and Inner Sheen */
        .ocean-panel-root select.ocean-select {
          width: 100% !important;
          height: 42px !important;
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          padding: 10px 34px 10px 42px !important;
          background: rgba(3, 16, 36, 0.58) !important;
          border: 1px solid rgba(56, 189, 248, 0.2) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.18) !important;
          border-radius: 10px !important;
          color: #f8fafc !important;
          font-family: inherit !important;
          font-size: 0.83rem !important;
          font-weight: 500 !important;
          outline: none !important;
          cursor: pointer !important;
          box-shadow: 
            inset 0 1px 2px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 2px 8px rgba(0, 0, 0, 0.2) !important;
          backdrop-filter: blur(14px) !important;
          -webkit-backdrop-filter: blur(14px) !important;
          transition: all 0.2s ease !important;
        }

        .ocean-panel-root select.ocean-select:hover:not(:disabled) {
          border-color: rgba(56, 189, 248, 0.45) !important;
          border-top-color: rgba(255, 255, 255, 0.28) !important;
          background: rgba(6, 26, 54, 0.72) !important;
        }

        .ocean-panel-root select.ocean-select:focus {
          border-color: #38bdf8 !important;
          box-shadow: 
            0 0 0 2px rgba(56, 189, 248, 0.25),
            inset 0 1px 2px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.14) !important;
          background: rgba(8, 30, 62, 0.8) !important;
        }

        .ocean-panel-root select.ocean-select:disabled {
          opacity: 0.45 !important;
          cursor: not-allowed !important;
          border-color: rgba(71, 85, 105, 0.25) !important;
        }

        .ocean-panel-root select.ocean-select option {
          background: #06172d !important;
          color: #f8fafc !important;
          padding: 10px !important;
        }

        .ocean-panel-root select.ocean-select option:disabled {
          color: #64748b !important;
        }

        /* Prominent Glass Dropdown: WHAT DO YOU WANT TO SEE? */
        .ocean-panel-root select.ocean-select-prominent {
          background: rgba(6, 26, 56, 0.65) !important;
          border: 1px solid rgba(56, 189, 248, 0.4) !important;
          border-top: 1px solid rgba(125, 211, 252, 0.35) !important;
          box-shadow: 
            0 2px 14px rgba(56, 189, 248, 0.12),
            inset 0 1px 2px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.12) !important;
        }

        .ocean-panel-root select.ocean-select-prominent:hover:not(:disabled) {
          border-color: rgba(56, 189, 248, 0.7) !important;
          border-top-color: rgba(186, 230, 253, 0.5) !important;
          box-shadow: 0 4px 20px rgba(56, 189, 248, 0.2), inset 0 1px 2px rgba(0, 0, 0, 0.4) !important;
        }

        .ocean-panel-root select.ocean-select-prominent:focus {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25), 0 0 18px rgba(56, 189, 248, 0.25) !important;
        }

        .ocean-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.18), transparent);
          margin: 2px 0;
        }

        .ocean-warning-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.32);
          border-radius: 8px;
          padding: 7px 10px;
          color: #fcd34d;
          font-size: 0.74rem;
          margin-top: 4px;
        }

        /* Glass Time Controls */
        .ocean-btn-group {
          display: grid;
          grid-template-columns: 1fr 1.25fr 1.25fr 1fr;
          gap: 6px;
          background: rgba(3, 12, 26, 0.55);
          padding: 4px;
          border-radius: 10px;
          border: 1px solid rgba(56, 189, 248, 0.16);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
        }

        .ocean-btn {
          padding: 8px 4px;
          font-size: 0.72rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: center;
          letter-spacing: 0.03em;
          font-family: inherit;
        }

        .ocean-btn-nav {
          background: rgba(8, 30, 58, 0.65);
          color: #bae6fd;
          border-color: rgba(56, 189, 248, 0.2);
          border-top-color: rgba(255, 255, 255, 0.12);
        }

        .ocean-btn-nav:hover:not(:disabled) {
          background: rgba(14, 45, 80, 0.9);
          border-color: rgba(56, 189, 248, 0.5);
          color: #ffffff;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
        }

        .ocean-btn-mode {
          background: rgba(6, 20, 40, 0.45);
          color: #94a3b8;
        }

        .ocean-btn-mode.active-dynamic {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.28) 100%) !important;
          color: #6ee7b7 !important;
          border-color: rgba(52, 211, 153, 0.55) !important;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
        }

        .ocean-btn-mode.active-static {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(185, 28, 28, 0.22) 100%) !important;
          color: #fca5a5 !important;
          border-color: rgba(248, 113, 113, 0.45) !important;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.15);
        }

        .ocean-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none !important;
        }

        .ocean-time-readouts {
          display: flex;
          gap: 8px;
        }

        .ocean-time-chip {
          background: rgba(3, 14, 28, 0.6);
          border: 1px solid rgba(56, 189, 248, 0.16);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 7px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          backdrop-filter: blur(10px);
        }

        .chip-label {
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #64748b;
        }

        .chip-val {
          font-family: 'Space Grotesk', 'Inter', monospace;
          font-size: 0.74rem;
          font-weight: 600;
          color: #38bdf8;
        }

        .chip-time-val {
          font-size: 0.72rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ocean-speed-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(3, 14, 28, 0.5);
          border: 1px solid rgba(56, 189, 248, 0.14);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 8px 12px;
          backdrop-filter: blur(10px);
        }

        .ocean-speed-badge {
          font-family: 'Space Grotesk', 'Inter', monospace;
          font-size: 0.72rem;
          font-weight: 700;
          color: #38bdf8;
          min-width: 26px;
          text-align: right;
        }

        .ocean-badge-status {
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 2px 7px;
          border-radius: 10px;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.25);
          color: #38bdf8;
        }

        /* ProfilePanel: Translucent Glass Information Card */
        .ocean-panel-root > div[style*="border"] {
          background: linear-gradient(
            135deg,
            rgba(16, 44, 82, 0.45) 0%,
            rgba(8, 28, 56, 0.35) 45%,
            rgba(4, 18, 38, 0.55) 100%
          ) !important;
          border: 1px solid rgba(56, 189, 248, 0.2) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.22) !important;
          border-left: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 16px !important;
          padding: 16px 18px !important;
          margin-top: 0 !important;
          box-shadow: 
            0 12px 36px 0 rgba(0, 6, 22, 0.45),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.16),
            inset 0 -1px 2px 0 rgba(0, 0, 0, 0.3) !important;
          backdrop-filter: blur(24px) saturate(190%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(190%) !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 14px !important;
        }

        .ocean-panel-root > div[style*="border"]:hover {
          border-color: rgba(56, 189, 248, 0.35) !important;
          border-top-color: rgba(255, 255, 255, 0.32) !important;
          box-shadow: 
            0 16px 42px 0 rgba(0, 8, 30, 0.55),
            inset 0 1px 2px 0 rgba(255, 255, 255, 0.22) !important;
        }

        .ocean-panel-root > div[style*="border"] h4 {
          margin: 0 !important;
          padding-bottom: 11px !important;
          border-bottom: 1px solid rgba(56, 189, 248, 0.12) !important;
          font-family: 'Space Grotesk', 'Inter', sans-serif !important;
          font-size: 0.82rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          color: #f1f5f9 !important;
          text-transform: uppercase !important;
          display: flex !important;
          align-items: center !important;
          gap: 9px !important;
        }

        .ocean-panel-root > div[style*="border"] h4::before {
          content: '';
          display: inline-block;
          width: 16px;
          height: 16px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='18' y1='20' x2='18' y2='10'/%3E%3Cline x1='12' y1='20' x2='12' y2='4'/%3E%3Cline x1='6' y1='20' x2='6' y2='14'/%3E%3C/svg%3E") no-repeat center;
          background-size: contain;
        }

        .ocean-panel-root > div[style*="border"] p {
          color: #94a3b8 !important;
          font-size: 0.77rem !important;
          line-height: 1.5 !important;
          margin: 0 !important;
          background: rgba(3, 14, 30, 0.52) !important;
          border: 1px solid rgba(56, 189, 248, 0.16) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 10px !important;
          padding: 12px 14px 12px 40px !important;
          position: relative !important;
          backdrop-filter: blur(10px) !important;
        }

        .ocean-panel-root > div[style*="border"] p::before {
          content: '';
          position: absolute;
          left: 14px;
          top: 13px;
          width: 15px;
          height: 15px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='12' y1='16' x2='12' y2='12'/%3E%3Cline x1='12' y1='8' x2='12.01' y2='8'/%3E%3C/svg%3E") no-repeat center;
          background-size: contain;
        }

        /* LayerControls: Glass Card Design */
        .ocean-layer-card > div {
          gap: 12px !important;
        }

        .ocean-layer-card h4 {
          margin: 0 0 2px 0 !important;
          padding-bottom: 11px !important;
          border-bottom: 1px solid rgba(56, 189, 248, 0.12) !important;
          font-family: 'Space Grotesk', 'Inter', sans-serif !important;
          font-size: 0.82rem !important;
          font-weight: 700 !important;
          letter-spacing: 0.08em !important;
          color: #f1f5f9 !important;
          text-transform: uppercase !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }

        .ocean-layer-card h4::before {
          content: '';
          display: inline-block;
          width: 16px;
          height: 16px;
          margin-right: 9px;
          vertical-align: middle;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338bdf8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='12 2 2 7 12 12 22 7 12 2'/%3E%3Cpolyline points='2 17 12 22 22 17'/%3E%3Cpolyline points='2 12 12 17 22 12'/%3E%3C/svg%3E") no-repeat center;
          background-size: contain;
        }

        .ocean-layer-card label {
          color: #cbd5e1 !important;
          font-size: 0.79rem !important;
          font-weight: 500 !important;
          display: flex !important;
          align-items: center !important;
          gap: 9px !important;
          cursor: pointer !important;
          margin-bottom: 0 !important;
          padding: 4px 0;
          transition: color 0.15s ease;
        }

        .ocean-layer-card label:hover {
          color: #ffffff !important;
        }

        .ocean-layer-card input[type='checkbox'] {
          accent-color: #38bdf8 !important;
          width: 15px !important;
          height: 15px !important;
          cursor: pointer !important;
        }

        /* Glass Ocean Waves Footer with Subtle Sheen */
        .ocean-footer-deco {
          position: relative;
          margin-top: 8px;
          padding-top: 28px;
          padding-bottom: 12px;
          overflow: hidden;
          border-radius: 16px;
          background: linear-gradient(
            180deg,
            rgba(10, 32, 60, 0.15) 0%,
            rgba(6, 26, 50, 0.38) 45%,
            rgba(4, 18, 36, 0.65) 100%
          );
          border: 1px solid rgba(56, 189, 248, 0.14);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: flex-end;
          min-height: 80px;
          box-shadow: 
            0 8px 24px rgba(0, 4, 14, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .ocean-deco-waves {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .ocean-footer-tag-wrap {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 0 16px 4px 0;
        }

        .ocean-footer-title {
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          font-style: italic;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.02em;
        }

        .ocean-footer-subtitle {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'Inter', sans-serif;
          font-size: 0.73rem;
          font-style: italic;
          font-weight: 500;
          color: #64748b;
        }

        .ocean-footer-line {
          display: inline-block;
          width: 24px;
          height: 1.5px;
          background: #38bdf8;
          opacity: 0.75;
          border-radius: 1px;
        }
      `}</style>

      {/* Main Ocean Controls Card */}
      <div className="ocean-card">
        <div className="ocean-card-header">
          <div className="ocean-card-title">
            {/* Flowing ocean wave icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            </svg>
            <span>Ocean Controls</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </div>

        {/* Model Dataset Selector */}
        <div className="ocean-ctrl-group">
          <div className="ocean-ctrl-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>Model Dataset</span>
          </div>
          <div className="ocean-select-wrap">
            <div className="ocean-select-icon-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <select 
              className="ocean-select"
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
            <div className="ocean-select-icon-right">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
          
          {!profile && state.activeDatasetId && (
            <div className="ocean-warning-banner">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>This dataset does not yet have a visualization profile.</span>
            </div>
          )}
        </div>
        
        <div className="ocean-divider" />

        {/* PRIMARY SELECTOR: What do you want to see? (Visual Focal Point) */}
        <div className="ocean-ctrl-group">
          <div className="ocean-ctrl-label ocean-ctrl-label-prominent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>WHAT DO YOU WANT TO SEE?</span>
          </div>
          <div className="ocean-select-wrap">
            <div className="ocean-select-icon-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <select 
              className="ocean-select ocean-select-prominent"
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
            <div className="ocean-select-icon-right">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        <div className="ocean-divider" />
        
        {/* Observations Selector */}
        <div className="ocean-ctrl-group">
          <div className="ocean-ctrl-label">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>Obs Dataset</span>
          </div>
          <div className="ocean-select-wrap">
            <div className="ocean-select-icon-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <select 
              className="ocean-select"
              value={state.activeObsDatasetId || ''} 
              onChange={(e) => handleObsDatasetSelect(e.target.value)}
            >
              <option value="">None selected</option>
              {state.availableObservations.map(d => (
                <option key={d.id} value={d.id}>{d.name || d.id}</option>
              ))}
            </select>
            <div className="ocean-select-icon-right">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Time Controls (shown if time length > 1 and a relevant view is selected) */}
      {(showDataControls || showVectorControls) && state.times.length > 1 && (
        <div className="ocean-card">
          <div className="ocean-card-header">
            <div className="ocean-card-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Time Controls</span>
            </div>
            <span className="ocean-badge-status">
              {state.isAnimating ? 'DYNAMIC' : 'STATIC'}
            </span>
          </div>

          <div className="ocean-btn-group">
            <button 
              className="ocean-btn ocean-btn-nav"
              onClick={() => fetchFrame(Math.max(0, state.activeTimeIndex - 1))}
              disabled={state.activeTimeIndex === 0 || state.isAnimating}
              title="Previous Frame"
            >
              ◀ Prev
            </button>
            <button 
              className={`ocean-btn ocean-btn-mode ${state.isAnimating ? 'active-dynamic' : ''}`}
              onClick={startAnimation} 
              disabled={state.isAnimating}
              style={{ fontWeight: state.isAnimating ? 'bold' : 'normal' }}
            >
              DYNAMIC
            </button>
            <button 
              className={`ocean-btn ocean-btn-mode ${!state.isAnimating ? 'active-static' : ''}`}
              onClick={stopAnimation} 
              disabled={!state.isAnimating}
              style={{ fontWeight: !state.isAnimating ? 'bold' : 'normal' }}
            >
              STATIC
            </button>
            <button 
              className="ocean-btn ocean-btn-nav"
              onClick={() => fetchFrame(Math.min(state.times.length - 1, state.activeTimeIndex + 1))}
              disabled={state.activeTimeIndex === state.times.length - 1 || state.isAnimating}
              title="Next Frame"
            >
              Next ▶
            </button>
          </div>
          
          <div className="ocean-time-readouts">
            <div className="ocean-time-chip">
              <span className="chip-label">FRAME</span>
              <span className="chip-val">{state.activeTimeIndex + 1} / {state.times.length}</span>
            </div>
            <div className="ocean-time-chip" style={{ flex: 1, minWidth: 0 }}>
              <span className="chip-label">TIME</span>
              <span className="chip-val chip-time-val">{state.times[state.activeTimeIndex]}</span>
            </div>
          </div>

          <div className="ocean-speed-row">
            <span className="chip-label" style={{ minWidth: '42px' }}>SPEED:</span>
            <input 
              type="range" 
              min="0.5" 
              max="5" 
              step="0.5" 
              value={state.animationSpeed || 1}
              onChange={(e) => dispatch({ type: 'SET_ANIMATION_SPEED', payload: parseFloat(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span className="ocean-speed-badge">{state.animationSpeed || 1}x</span>
          </div>
        </div>
      )}

      {/* Colormap Controls for scalar data fields */}
      {showDataControls && (
        <div className="ocean-card">
          <ColormapWidget />
        </div>
      )}

      {/* Instrument Profile Panel (Unified Card) */}
      <ProfilePanel />
      
      {/* Layer Visibility (Unified Card) */}
      <div className="ocean-card ocean-layer-card">
        <LayerControls />
      </div>

      {/* Decorative Ocean Waves Footer */}
      <div className="ocean-footer-deco">
        <svg className="ocean-deco-waves" viewBox="0 0 320 65" preserveAspectRatio="none">
          <path d="M0,25 C40,15 90,35 140,22 C190,10 240,30 280,18 C300,12 315,16 320,18 L320,65 L0,65 Z" fill="rgba(6, 32, 60, 0.45)" />
          <path d="M0,32 C50,22 100,42 160,28 C220,15 270,36 320,24 L320,65 L0,65 Z" fill="rgba(8, 42, 78, 0.4)" />
          <path d="M0,40 C60,30 110,48 180,35 C250,22 290,40 320,32 L320,65 L0,65 Z" fill="rgba(14, 60, 100, 0.35)" />
          <path d="M0,25 C40,15 90,35 140,22 C190,10 240,30 280,18 C300,12 315,16 320,18" fill="none" stroke="rgba(56, 189, 248, 0.28)" strokeWidth="1" />
          <path d="M0,32 C50,22 100,42 160,28 C220,15 270,36 320,24" fill="none" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="0.8" />
        </svg>
        <div className="ocean-footer-tag-wrap">
          <div className="ocean-footer-title">Oceans</div>
          <div className="ocean-footer-subtitle">
            <span className="ocean-footer-line" />
            <span>Connect Us All</span>
          </div>
        </div>
      </div>
    </div>
  );
}
