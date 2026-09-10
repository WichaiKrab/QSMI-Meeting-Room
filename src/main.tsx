import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { cleanupStorageCredentials } from './utils/securityUtils';

// Immediate auto-purge of legacy plaintext passwords in browser storage
cleanupStorageCredentials();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
