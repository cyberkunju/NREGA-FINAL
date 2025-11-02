import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './i18n/config'; // Initialize i18n BEFORE App
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline support and caching
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('App is ready for offline use');
  },
  onUpdate: (registration) => {
    console.log('New version available. Please refresh to update.');
    // Optionally show a notification to the user
  }
});
