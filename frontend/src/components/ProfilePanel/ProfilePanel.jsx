import React from 'react';
import { useAppState } from '../../context/AppContext';

export default function ProfilePanel() {
  const { selectedInstrumentId, profileData, isLoading, error } = useAppState();
  const [activeVar, setActiveVar] = React.useState('');

  React.useEffect(() => {
    if (profileData && profileData.profiles) {
      const vars = Object.keys(profileData.profiles);
      if (vars.length > 0) {
        setActiveVar(vars.includes('temperature') ? 'temperature' : vars[0]);
      }
    }
  }, [profileData]);

  if (!selectedInstrumentId) {
    return (
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h4>Instrument Profile</h4>
        <p style={{ color: '#666' }}>No instrument selected. Click an Argo marker in the 3D scene to view profile data.</p>
      </div>
    );
  }

  if (isLoading && !profileData) {
    return (
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h4>Instrument Profile: {selectedInstrumentId}</h4>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #f00', color: '#f00' }}>
        <h4>Error loading profile</h4>
        <p>{error.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (profileData.instrument_type === 'hf_radar') {
    return (
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h4>Instrument: {selectedInstrumentId} (HF-Radar)</h4>
        <p style={{ fontSize: '0.9em' }}>
          <strong>Lat:</strong> {profileData.lat?.toFixed(4)} | <strong>Lon:</strong> {profileData.lon?.toFixed(4)}<br/>
          <strong>Time:</strong> {profileData.timestamp || 'N/A'}
        </p>
        <div style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
          <p><strong>Surface Current</strong></p>
          <ul style={{ fontSize: '0.9em', listStyle: 'none', padding: 0 }}>
            <li>U (Eastward): {profileData.profiles?.u?.[0] !== undefined ? profileData.profiles.u[0].toFixed(3) : 'N/A'} m/s</li>
            <li>V (Northward): {profileData.profiles?.v?.[0] !== undefined ? profileData.profiles.v[0].toFixed(3) : 'N/A'} m/s</li>
            <li>Magnitude: {
              (profileData.profiles?.u?.[0] !== undefined && profileData.profiles?.v?.[0] !== undefined)
                ? Math.sqrt(Math.pow(profileData.profiles.u[0], 2) + Math.pow(profileData.profiles.v[0], 2)).toFixed(3)
                : 'N/A'
            } m/s</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.depths || profileData.depths.length === 0) {
    return (
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h4>Instrument Profile: {selectedInstrumentId}</h4>
        <p style={{ color: '#666' }}>No profile data available for this instrument.</p>
      </div>
    );
  }

  // Find all available variables
  const variables = Object.keys(profileData.profiles || {});
  
  const variableData = activeVar && profileData.profiles ? profileData.profiles[activeVar] : null;

  return (
    <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
      <h4>Instrument Profile: {selectedInstrumentId}</h4>
      <p style={{ fontSize: '0.9em' }}>
        <strong>Lat:</strong> {profileData.lat?.toFixed(4)} | <strong>Lon:</strong> {profileData.lon?.toFixed(4)}<br/>
        <strong>Type:</strong> {profileData.instrument_type?.toUpperCase()}
      </p>
      
      {variables.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <select value={activeVar} onChange={(e) => setActiveVar(e.target.value)} style={{ padding: '4px' }}>
            {variables.map(v => (
              <option key={v} value={v}>{v.toUpperCase()} {profileData.units?.[v] ? `(${profileData.units[v]})` : ''}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #eee', paddingTop: '10px' }}>
        <table style={{ width: '100%', fontSize: '0.9em', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Depth (m)</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {profileData.depths.map((d, i) => (
              <tr key={i}>
                <td>{d !== null ? d.toFixed(1) : '--'}</td>
                <td>{variableData && variableData[i] !== null ? variableData[i].toFixed(2) : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
