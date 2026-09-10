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

  const isReady = !state.isLoading;

  const items = [
    {
      id: 'dataset',
      label: 'Dataset',
      value: datasetName,
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
      ),
    },
    {
      id: 'variable',
      label: 'Variable',
      value: variable,
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      id: 'depth',
      label: 'Depth',
      value: depth,
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <polyline points="19 12 12 19 5 12"/>
        </svg>
      ),
    },
    {
      id: 'time',
      label: 'Time',
      value: time,
      icon: (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        .sb-root {
          display: flex;
          align-items: center;
          justify-content: space-between;
          /* Escape the 20px padding of .app-footer so we span full width */
          width: calc(100% + 40px);
          margin-left: -20px;
          margin-right: -20px;
          height: 46px;
          padding: 0 24px;
          box-sizing: border-box;
          flex-shrink: 0;
          background: linear-gradient(90deg,
            rgba(2,8,22,0.96) 0%,
            rgba(4,14,40,0.94) 40%,
            rgba(4,14,40,0.94) 60%,
            rgba(2,8,22,0.96) 100%
          );
          backdrop-filter: blur(20px) saturate(1.6);
          -webkit-backdrop-filter: blur(20px) saturate(1.6);
          border-top: 1px solid rgba(0,220,240,0.28);
          box-shadow:
            0 -1px 0 rgba(255,255,255,0.05) inset,
            0 -8px 28px rgba(0,0,0,0.45),
            0 -1px 12px rgba(0,200,230,0.06);
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }
        .sb-items {
          display: flex;
          align-items: stretch;
          height: 100%;
          flex: 1;
          min-width: 0;
        }
        .sb-item {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 18px;
          min-width: 0;
          position: relative;
        }
        .sb-item + .sb-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 20px;
          background: linear-gradient(to bottom, transparent, rgba(0,210,230,0.22), transparent);
        }
        .sb-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(56, 189, 248, 0.60);
          line-height: 1;
          margin-bottom: 4px;
          white-space: nowrap;
        }
        .sb-label svg { opacity: 0.85; flex-shrink: 0; }
        .sb-value {
          font-size: 12.5px;
          font-weight: 600;
          color: rgba(180, 210, 235, 0.70);
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
          letter-spacing: 0.01em;
        }
        .sb-value.sb-active { color: #e8f4ff; }
        .sb-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding-left: 16px;
          border-left: 1px solid rgba(0,210,230,0.13);
          flex-shrink: 0;
        }
        .sb-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .sb-dot--ready   { background: #10d490; box-shadow: 0 0 7px rgba(16,212,144,0.65); }
        .sb-dot--loading { background: #38bdf8; box-shadow: 0 0 7px rgba(56,189,248,0.65); animation: sb-pulse 1.1s ease-in-out infinite; }
        .sb-status-text  { font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; white-space: nowrap; }
        .sb-status-text--ready   { color: #10d490; }
        .sb-status-text--loading { color: #38bdf8; }
        @keyframes sb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.82); }
        }
        @media (max-width: 780px) {
          .sb-item { padding: 0 12px; }
          .sb-value { font-size: 11px; max-width: 100px; }
        }
        @media (max-width: 560px) {
          .sb-item--time { display: none; }
          .sb-item { padding: 0 10px; }
        }
      `}</style>

      <div className="sb-root">
        <div className="sb-items">
          {items.map(({ id, icon, label, value }) => (
            <div key={id} className={`sb-item sb-item--${id}`}>
              <div className="sb-label">{icon}{label}</div>
              <div className={`sb-value${value !== 'None' && value !== 'T0' && value !== '0m' ? ' sb-active' : ''}`}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="sb-status">
          <span className={`sb-dot ${isReady ? 'sb-dot--ready' : 'sb-dot--loading'}`} />
          <span className={`sb-status-text ${isReady ? 'sb-status-text--ready' : 'sb-status-text--loading'}`}>
            {state.isLoading ? 'Loading…' : 'Ready'}
          </span>
        </div>
      </div>
    </>
  );
}