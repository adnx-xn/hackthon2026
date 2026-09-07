import React from 'react';
import { useAppState } from './context/AppContext';
import OceanCanvas from './components/OceanCanvas/OceanCanvas';
import ControlPanel from './components/ControlPanel/ControlPanel';
import StatusBar from './components/StatusBar/StatusBar';
import './App.css';

function App() {
  const { isLoading, error } = useAppState();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>INCOIS 3D Ocean Data Visualization</h1>
        {isLoading && <span className="loading-indicator">Loading...</span>}
      </header>

      {error && (
        <div className="error-banner">
          <p>Error: {error.message || 'An unexpected error occurred.'}</p>
        </div>
      )}

      <main className="app-main">
        <div className="canvas-container">
          <OceanCanvas />
        </div>

        <aside className="control-panel-container">
          <ControlPanel />
        </aside>
      </main>

      <footer className="app-footer">
        <StatusBar />
      </footer>
    </div>
  );
}

export default App;
