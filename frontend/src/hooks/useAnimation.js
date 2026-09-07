import { useEffect, useRef, useCallback } from 'react';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { getMultiDataSlices, getDataSlice, getVectorSlice } from '../api/apiClient';
import datasetProfiles from '../config/datasetProfiles.json';

export function useAnimation() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  
  const animFrameNonce = useRef(0);
  const isAnimatingRef = useRef(false);
  const timeoutIdRef = useRef(null);

  // Snapshot the state so the async loop always has the latest 
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const stopAnimation = useCallback(() => {
    isAnimatingRef.current = false;
    animFrameNonce.current += 1; // invalidate any pending frame
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    dispatch({ type: 'SET_ANIMATING', payload: false });
  }, [dispatch]);

  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    dispatch({ type: 'SET_ANIMATING', payload: true });
    
    runFrame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFrame = useCallback(async (timeIndex) => {
    const currentState = stateRef.current;
    if (!currentState.activeDatasetId) return false;
    
    const profile = datasetProfiles[currentState.activeDatasetId];
    if (!profile || !profile.views) return false;
    
    const viewConfig = profile.views[currentState.primaryView];
    
    // increment nonce for stale protection
    animFrameNonce.current += 1;
    const frameNonce = animFrameNonce.current;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      if (viewConfig && viewConfig.renderType === 'scalarSurface') {
        const data = await getDataSlice(
          currentState.activeDatasetId,
          currentState.activeVariable,
          viewConfig.depthIdx || 0,
          timeIndex
        );
        
        if (animFrameNonce.current !== frameNonce) return false;
        
        const normalizedPayload = {
          values: data.values,
          latitudes: data.lat,
          longitudes: data.lon,
          valueMin: data.value_min ?? data.metadata?.value_min,
          valueMax: data.value_max ?? data.metadata?.value_max,
          units: data.units ?? data.metadata?.units,
          label: currentState.primaryView
        };
        
        dispatch({ type: 'SET_TIME_INDEX', payload: timeIndex });
        dispatch({ type: 'SET_SURFACE_DATA', payload: normalizedPayload });
        return true;
        
      } else if (viewConfig && viewConfig.renderType === 'surfaceVectors') {
        const data = await getVectorSlice(
          currentState.activeDatasetId,
          viewConfig.depthIdx || 0,
          timeIndex
        );
        
        if (animFrameNonce.current !== frameNonce) return false;
        
        dispatch({ type: 'SET_TIME_INDEX', payload: timeIndex });
        dispatch({ type: 'SET_VECTOR_DATA', payload: data });
        return true;
        
      } else {
        // Fallback for multi-slice (Volume) or other types
        if (!currentState.activeVariable) return false;
        const data = await getMultiDataSlices(
          currentState.activeDatasetId,
          currentState.activeVariable,
          currentState.activeDepthIndex,
          currentState.depths,
          timeIndex
        );
        
        if (animFrameNonce.current !== frameNonce) return false;
        
        dispatch({ type: 'SET_TIME_INDEX', payload: timeIndex });
        dispatch({ type: 'SET_MULTI_SLICE_DATA', payload: data });
        return true;
      }
    } catch (err) {
      if (animFrameNonce.current !== frameNonce) return false;
      console.error("Frame fetch failed:", err);
      dispatch({ type: 'SET_ERROR', payload: err });
      return false;
    } finally {
      if (animFrameNonce.current === frameNonce) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [dispatch]);

  const runFrame = async () => {
    if (!isAnimatingRef.current) return;
    
    const currentState = stateRef.current;
    
    if (!currentState.activeDatasetId || !currentState.times || currentState.times.length === 0) {
      stopAnimation();
      return;
    }

    const nextTimeIndex = currentState.activeTimeIndex + 1;
    
    if (nextTimeIndex >= currentState.times.length) {
      stopAnimation();
      return;
    }

    const success = await fetchFrame(nextTimeIndex);
    
    if (!success) {
      if (isAnimatingRef.current) stopAnimation();
      return;
    }

    if (isAnimatingRef.current) {
      const latestState = stateRef.current;
      const delay = 1000 / (latestState.animationSpeed || 1);
      timeoutIdRef.current = setTimeout(() => {
        runFrame();
      }, delay);
    }
  };

  useEffect(() => {
    stopAnimation();
  }, [state.activeDatasetId, state.activeVariable, state.activeDepthIndex, stopAnimation]);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    isAnimating: state.isAnimating,
    startAnimation,
    stopAnimation,
    fetchFrame
  };
}
