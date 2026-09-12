import React, { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home';
import Visualization from './pages/Visualization';
import About from './pages/About';
import ChatSupport from './pages/ChatSupport';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigation} />;

      case 'about':
        return <About />;

      case 'chat':
        return <ChatSupport />;

      case 'visualization':
      default:
        return <Visualization />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-screen relative bg-[linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,12,27,0.35))]">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={handleNavigation}
      />

      {renderPage()}
    </div>
  );
}

export default App;