import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import ProjectsView from './views/ProjectsView.tsx';
import UsersView from './views/UsersView.tsx';
import ProjectDetailsView from './views/ProjectDetailsView.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { BIMProvider } from './context/BIMContext.tsx';

function App() {
  return (
    <AppProvider>
      <BIMProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<ProjectsView />} />
            <Route path="projects/:id" element={<ProjectDetailsView />} />
            <Route path="users" element={<UsersView />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </BIMProvider>
    </AppProvider>
  );
}

export default App;
