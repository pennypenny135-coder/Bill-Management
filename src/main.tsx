import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthProvider';
import AuthBoundary from './auth/AuthBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider><AuthBoundary><App /></AuthBoundary></AuthProvider>
  </StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed', err));
  });
}
