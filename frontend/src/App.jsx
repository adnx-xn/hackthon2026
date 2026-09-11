import React, { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home';
import Visualization from './pages/Visualization';
import About from './pages/About';
import Temperature from './pages/Temperature';
import Salinity from './pages/Salinity';
import VO from './pages/VO';
import UO from './pages/UO';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('visualization');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'about':
      case '/about':
        return <About onNavigate={setCurrentPage} />;
      case 'learn-more/temperature':
      case '/learn-more/temperature':
        return <Temperature onNavigate={setCurrentPage} />;
      case 'learn-more/salinity':
      case '/learn-more/salinity':
        return <Salinity onNavigate={setCurrentPage} />;
      case 'learn-more/vo':
      case '/learn-more/vo':
        return <VO onNavigate={setCurrentPage} />;
      case 'learn-more/uo':
      case '/learn-more/uo':
        return <UO onNavigate={setCurrentPage} />;
      case 'visualization':
      default:
        return <Visualization />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen relative bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,12,27,0.35))]">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {renderPage()}
    </div>
  );
}

export default App;
