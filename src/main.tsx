import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log = ((function(ol) {
  return function(...args: any[]) {
    const now = new Date().toLocaleTimeString();
    ol.apply(console, [`[${now}]`, ...args]);
  };
})(console.log));

console.log('🚀 Metapharsic App Initializing...');

const root = document.getElementById('root');
if (!root) {
  console.error('❌ Root element not found');
  document.body.innerHTML = '<h1 style="color: red; padding: 20px;">Error: Root element not found</h1>';
} else {
  console.log('✓ Root element found:', root);
  try {
    console.log('Creating React root...');
    const reactRoot = createRoot(root);
    console.log('✓ React root created');
    
    console.log('Rendering App component...');
    reactRoot.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('✓ App rendering initiated');
  } catch (error) {
    console.error('❌ Render error:', error);
    const errorMessage = error instanceof Error ? error.message + '\n' + error.stack : String(error);
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace; white-space: pre-wrap;"><h1>App Initialization Error</h1><pre>${errorMessage}</pre></div>`;
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled rejection:', event.reason);
});
