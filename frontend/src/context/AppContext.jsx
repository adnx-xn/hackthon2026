import React, { createContext, useContext, useReducer } from 'react';

// Initial state matches ARCHITECTURE.md §4.2
const initialState = {
  // Dataset state
  availableDatasets: [],
  activeDatasetId: null,
  activeDatasetMeta: null,

  // Available controls
  variables: [],
  depths: [],
  times: [],

  // Active selections
  activeVariable: null,
  activeDepthIndex: 0,
  activeTimeIndex: 0,

  // Visualization parameters
  primaryView: 'None', // 'None', 'Temperature', 'Salinity', 'Depth', 'Currents'
  colormapPalette: 'viridis',
  colorStops: null,
  colormapMin: null,
  colormapMax: null,
  colormapScale: 'linear',
  layerOpacity: 1.0,
  verticalExaggeration: 50,
  showCurrentVectors: false,

  // Instrument state
  availableObservations: [],
  activeObsDatasetId: null,
  obsLayerVisibility: {
    argo: true,
    glider: true,
    ctd: true,
    bgc: true,
    mooring: true,
    hf_radar: true,
    adcp: true
  },
  instruments: [],
  selectedInstrumentId: null,
  profileData: null,

  // Slice & Volume data
  multiSliceData: [],
  volumeData: null,
  surfaceData: null,
  vectorData: null,

  // UI state
  isLoading: false,
  error: null,
  isAnimating: false,
  animationSpeed: 1,

  // Globe state
  showEarth: true,
};

const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_AVAILABLE_DATASETS':
      return { ...state, availableDatasets: action.payload };
    case 'SET_ACTIVE_DATASET':
      return { 
        ...state, 
        activeDatasetId: action.payload.id,
        activeDatasetMeta: action.payload.meta,
        variables: action.payload.variables || [],
        depths: action.payload.depths || [],
        times: action.payload.times || [],
        activeVariable: null,
        activeDepthIndex: 0,
        activeTimeIndex: 0,
        multiSliceData: [], // Clear old slice data
        volumeData: null,   // Clear old volume data
        surfaceData: null,  // Clear old surface data
        primaryView: 'None' // Reset view on dataset change
      };
    case 'SET_ACTIVE_VARIABLE':
      return { ...state, activeVariable: action.payload };
    case 'SET_DEPTH_INDEX':
      return { ...state, activeDepthIndex: action.payload };
    case 'SET_TIME_INDEX':
      return { ...state, activeTimeIndex: action.payload };
    case 'SET_VERTICAL_EXAGGERATION':
      return { ...state, verticalExaggeration: action.payload };
    case 'SET_MULTI_SLICE_DATA':
      return { ...state, multiSliceData: action.payload };
    case 'SET_VOLUME_DATA': {
      const vData = action.payload;
      let newIsoValue = state.isosurfaceValue;
      if (vData && vData.metadata) {
        const { value_min, value_max } = vData.metadata;
        if (newIsoValue === null || newIsoValue < value_min || newIsoValue > value_max) {
          newIsoValue = (value_min + value_max) / 2.0;
        }
      }
      return { ...state, volumeData: vData, isosurfaceValue: newIsoValue };
    }
    case 'SET_SURFACE_DATA':
      return { ...state, surfaceData: action.payload };
    case 'SET_VECTOR_DATA':
      return { ...state, vectorData: action.payload };
      
    // Visualization and Colormap actions
    case 'SET_PRIMARY_VIEW':
      return { ...state, primaryView: action.payload };
    case 'SET_COLORMAP_PALETTE':
      return { ...state, colormapPalette: action.payload };
    case 'SET_COLOR_STOPS':
      return { ...state, colorStops: action.payload };
    case 'SET_COLORMAP_MIN':
      return { ...state, colormapMin: action.payload };
    case 'SET_COLORMAP_MAX':
      return { ...state, colormapMax: action.payload };
    case 'SET_COLORMAP_SCALE':
      return { ...state, colormapScale: action.payload };
    case 'SET_LAYER_OPACITY':
      return { ...state, layerOpacity: action.payload };
    case 'TOGGLE_VECTORS':
      return { ...state, showCurrentVectors: action.payload };
    case 'TOGGLE_OBS_LAYER':
      return { 
        ...state, 
        obsLayerVisibility: {
          ...state.obsLayerVisibility,
          [action.payload.layer]: action.payload.visible
        }
      };
      
    // Observation / Instrument actions
    case 'SET_AVAILABLE_OBSERVATIONS':
      return { ...state, availableObservations: action.payload };
    case 'SET_ACTIVE_OBS_DATASET':
      return { ...state, activeObsDatasetId: action.payload };
    case 'SET_INSTRUMENTS':
      return { ...state, instruments: action.payload };
    case 'SET_SELECTED_INSTRUMENT':
      return { ...state, selectedInstrumentId: action.payload };
    case 'SET_PROFILE_DATA':
      return { ...state, profileData: action.payload };
      
    // UI states
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ANIMATING':
      return { ...state, isAnimating: action.payload };
    case 'SET_ANIMATION_SPEED':
      return { ...state, animationSpeed: action.payload };
    case 'TOGGLE_EARTH':
      return { ...state, showEarth: action.payload };
      
      
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === null) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (context === null) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
}
