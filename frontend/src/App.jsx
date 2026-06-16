import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import AdminGuard from './components/AdminGuard';
import AIAssistant from './components/AIAssistant/AIAssistant';
import Home from './pages/Home/Home';
import TutorialList from './pages/Tutorials/TutorialList';
import TutorialDetail from './pages/Tutorials/TutorialDetail';
import ToolList from './pages/Tools/ToolList';
import ToolDetail from './pages/Tools/ToolDetail';
import PathwayList from './pages/Pathways/PathwayList';
import PathwayDetail from './pages/Pathways/PathwayDetail';
import ScenarioList from './pages/Scenarios/ScenarioList';
import ScenarioDetail from './pages/Scenarios/ScenarioDetail';
import PromptList from './pages/Prompts/PromptList';
import PromptDetail from './pages/Prompts/PromptDetail';
import SkillList from './pages/Skills/SkillList';
import SkillPackage from './pages/Skills/SkillPackage';
import SkillDetail from './pages/Skills/SkillDetail';
import SearchResults from './pages/Search/SearchResults';
import MyLearning from './pages/MyLearning/MyLearning';
import AdminLayout from './pages/Admin/AdminLayout';
import TutorialManager from './pages/Admin/TutorialManager';
import PathwayManager from './pages/Admin/PathwayManager';
import MaterialsBrowser from './pages/Admin/MaterialsBrowser';
import UserManager from "./pages/Admin/UserManager";
import ContentEntityManager from './pages/Admin/ContentEntityManager';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <ErrorBoundary>
      <div className="app">
        <Routes>
        {/* Admin routes — standalone layout, no public Navbar/Footer */}
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<Navigate to="/admin/tutorials" replace />} />
          <Route path="tutorials" element={<TutorialManager />} />
          <Route path="pathways" element={<PathwayManager />} />
          <Route path="scenarios" element={<ContentEntityManager type="scenarios" />} />
          <Route path="prompts" element={<ContentEntityManager type="prompts" />} />
          <Route path="tools" element={<ContentEntityManager type="tools" />} />
          <Route path="skills" element={<ContentEntityManager type="skills" />} />
          <Route path="skill-packages" element={<ContentEntityManager type="skill-packages" />} />
          <Route path="materials" element={<MaterialsBrowser />} />
          <Route path="users" element={<UserManager />} />
        </Route>

        {/* Public routes */}
        <Route path="*" element={
          <>
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
                <Route path="/scenarios/:slug" element={<ScenarioDetail />} />
                <Route path="/prompts" element={<PromptList />} />
                <Route path="/prompts/:slug" element={<PromptDetail />} />
                <Route path="/skills" element={<SkillList />} />
                <Route path="/skills/:package" element={<SkillPackage />} />
                <Route path="/skills/:package/:slug" element={<SkillDetail />} />
                <Route path="/my-learning" element={<MyLearning />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <AIAssistant />
          </>
        } />
      </Routes>
    </div>
    </ErrorBoundary>
  );
};

export default App;
