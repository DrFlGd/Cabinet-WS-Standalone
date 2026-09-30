import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import WorkspaceErrorBoundary from './components/WorkspaceErrorBoundary';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkspaceErrorBoundary>
      <App />
    </WorkspaceErrorBoundary>
  </StrictMode>,
);
