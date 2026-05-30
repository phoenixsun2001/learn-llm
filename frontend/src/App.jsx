import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import TutorialList from './pages/Tutorials/TutorialList';
import TutorialDetail from './pages/Tutorials/TutorialDetail';
import ToolList from './pages/Tools/ToolList';
import ToolDetail from './pages/Tools/ToolDetail';
import PathwayList from './pages/Pathways/PathwayList';
import PathwayDetail from './pages/Pathways/PathwayDetail';
import ScenarioList from './pages/Scenarios/ScenarioList';

const App = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutorials" element={<TutorialList />} />
          <Route path="/tutorials/:slug" element={<TutorialDetail />} />
          <Route path="/tools" element={<ToolList />} />
          <Route path="/tools/:slug" element={<ToolDetail />} />
          <Route path="/pathways" element={<PathwayList />} />
          <Route path="/pathways/:slug" element={<PathwayDetail />} />
          <Route path="/scenarios" element={<ScenarioList />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
