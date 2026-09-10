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
      <div className="mt-[20px] p-[10px] border border-[#ccc]">
        <h4>Instrument Profile</h4>
        <p className="text-[#666]">No instrument selected. Click an Argo marker in the 3D scene to view profile data.</p>
      </div>
    );
  }

  if (isLoading && !profileData) {
    return (
      <div className="mt-[20px] p-[10px] border border-[#ccc]">
        <h4>Instrument Profile: {selectedInstrumentId}</h4>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-[20px] p-[10px] border border-[#f00] text-[#f00]">
        <h4>Error loading profile</h4>
        <p>{error.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (profileData.instrument_type === 'hf_radar') {
    return (
      <div className="mt-[20px] p-[10px] border border-[#ccc]">
        <h4>Instrument: {selectedInstrumentId} (HF-Radar)</h4>
        <p className="text-[0.9em]">
          <strong>Lat:</strong> {profileData.lat?.toFixed(4)} | <strong>Lon:</strong> {profileData.lon?.toFixed(4)}<br/>
          <strong>Time:</strong> {profileData.timestamp || 'N/A'}
        </p>
        <div className="border-t border-[#eee] pt-[10px]">
          <p><strong>Surface Current</strong></p>
          <ul className="text-[0.9em] list-none p-0">
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
      <div className="mt-[20px] p-[10px] border border-[#ccc]">
        <h4>Instrument Profile: {selectedInstrumentId}</h4>
        <p className="text-[#666]">No profile data available for this instrument.</p>
      </div>
    );
  }

  // Find all available variables
  const variables = Object.keys(profileData.profiles || {});
  
  const variableData = activeVar && profileData.profiles ? profileData.profiles[activeVar] : null;

  return (
    <div className="mt-[20px] p-[10px] border border-[#ccc]">
      <h4>Instrument Profile: {selectedInstrumentId}</h4>
      <p className="text-[0.9em]">
        <strong>Lat:</strong> {profileData.lat?.toFixed(4)} | <strong>Lon:</strong> {profileData.lon?.toFixed(4)}<br/>
        <strong>Type:</strong> {profileData.instrument_type?.toUpperCase()}
      </p>
      
      {variables.length > 0 && (
        <div className="mb-[10px]">
          <select value={activeVar} onChange={(e) => setActiveVar(e.target.value)} className="w-full py-[9px] px-[11px] rounded-[8px] border border-[rgba(71,85,105,0.55)] bg-[rgba(2,12,27,0.72)] text-[#f8fafc] font-[inherit] text-[0.82rem] outline-none transition-all duration-200 ease-out hover:border-[rgba(56,189,248,0.3)] focus:border-[#38bdf8] focus:bg-[rgba(4,22,42,0.9)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.08)]">
            {variables.map(v => (
              <option key={v} value={v}>{v.toUpperCase()} {profileData.units?.[v] ? `(${profileData.units[v]})` : ''}</option>
            ))}
          </select>
        </div>
      )}

      <div className="max-h-[200px] overflow-y-auto border-t border-[#eee] pt-[10px]">
        <table className="w-full text-[0.9em] text-left">
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
