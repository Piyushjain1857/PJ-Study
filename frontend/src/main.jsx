import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';

// PJ Study Design System CSS Cascade
import './styles/variables.css';
import './styles/reset.css';
import './styles/typography.css';
import './styles/global.css';
import './styles/utilities.css';
import './styles/components.css';

// Register PWA service worker with auto-update
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
