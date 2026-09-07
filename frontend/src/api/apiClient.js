import axios from 'axios';

// Base URL is relative in production (empty string) or defined by env var
const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle standard API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Return structured error as per the V1 error contract
    if (error.response && error.response.data && error.response.data.error) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      error: true,
      code: 'NETWORK_ERROR',
      message: error.message || 'An unexpected network error occurred.',
    });
  }
);

// --- MODEL ENDPOINTS ---

export const listDatasets = async () => {
  const { data } = await apiClient.get('/api/v1/datasets');
  return data;
};

export const getDataset = async (id) => {
  const { data } = await apiClient.get(`/api/v1/datasets/${encodeURIComponent(id)}`);
  return data;
};

export const getVariables = async (id) => {
  const { data } = await apiClient.get(`/api/v1/datasets/${encodeURIComponent(id)}/variables`);
  return data;
};

export const getDepths = async (id) => {
  const { data } = await apiClient.get(`/api/v1/datasets/${encodeURIComponent(id)}/depths`);
  return data;
};

export const getTimes = async (id) => {
  const { data } = await apiClient.get(`/api/v1/datasets/${encodeURIComponent(id)}/times`);
  return data;
};

export const getDataSlice = async (id, variable, depthIdx, timeIdx) => {
  const { data } = await apiClient.get(`/api/v1/datasets/${encodeURIComponent(id)}/data`, {
    params: { variable, depth_idx: depthIdx, time_idx: timeIdx },
  });
  
  return data;
};

export const getMultiDataSlices = async (id, variable, activeDepthIndex, depthsArray, timeIdx) => {
  if (!depthsArray || depthsArray.length === 0) return [];
  
  // Select ~8 representative depths
  const targetCount = Math.min(8, depthsArray.length);
  const step = Math.max(1, Math.floor(depthsArray.length / targetCount));
  
  const indicesToFetch = new Set();
  for (let i = 0; i < depthsArray.length; i += step) {
    indicesToFetch.add(i);
  }
  // Ensure the active depth is always fetched
  indicesToFetch.add(activeDepthIndex);
  
  // Also add the very bottom layer if not present for a complete block
  indicesToFetch.add(depthsArray.length - 1);
  
  const sortedIndices = Array.from(indicesToFetch).sort((a, b) => a - b);
  
  const results = [];
  // Fetch sequentially to avoid crashing the NetCDF C-library in the backend
  for (const dIdx of sortedIndices) {
    try {
      const slice = await getDataSlice(id, variable, dIdx, timeIdx);
      results.push({ ...slice, depthIndex: dIdx });
    } catch (e) {
      console.warn(`Failed to fetch depth index ${dIdx}`, e);
    }
  }
  
  return results;
};

export const getVectorSlice = async (id, depthIdx, timeIdx) => {
  const { data } = await apiClient.get(`/api/v1/datasets/${encodeURIComponent(id)}/vectors`, {
    params: { depth_idx: depthIdx, time_idx: timeIdx },
  });
  return data;
};

export const getVolume = async (id, variable, timeIdx) => {
  const response = await apiClient.get(`/api/v1/datasets/${encodeURIComponent(id)}/volume`, {
    params: { variable, time_idx: timeIdx },
    responseType: 'arraybuffer'
  });
  
  const metadata = JSON.parse(response.headers['x-volume-metadata']);
  const data = new Float32Array(response.data);
  
  return { metadata, data };
};

export const getTerrainData = async (maxDim = 512) => {
  const response = await apiClient.get(`/api/v1/geography/terrain`, {
    params: { max_dim: maxDim },
    responseType: 'arraybuffer'
  });
  
  const metadata = JSON.parse(response.headers['x-terrain-metadata']);
  const data = new Float32Array(response.data);
  
  return { metadata, data };
};

// --- OBSERVATION ENDPOINTS ---

export const listObservations = async () => {
  const { data } = await apiClient.get('/api/v1/observations');
  return data;
};

export const getInstruments = async (datasetId) => {
  const { data } = await apiClient.get(`/api/v1/observations/${encodeURIComponent(datasetId)}/instruments`);
  return data;
};

export const getInstrument = async (datasetId, instrumentId) => {
  const { data } = await apiClient.get(
    `/api/v1/observations/${encodeURIComponent(datasetId)}/instruments/${encodeURIComponent(instrumentId)}`
  );
  return data;
};

export const getProfile = async (datasetId, instrumentId) => {
  const { data } = await apiClient.get(
    `/api/v1/observations/${encodeURIComponent(datasetId)}/instruments/${encodeURIComponent(instrumentId)}/profile`
  );
  return data;
};
