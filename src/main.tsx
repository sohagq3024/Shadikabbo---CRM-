import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline PWA attendance functionality
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New PWA content available');
  },
  onOfflineReady() {
    console.log('Shadikabbo Attendance Scanner is ready for offline usage');
  },
  onRegistered(registration) {
    if (registration) {
      console.log('Attendance Service Worker registered:', registration.scope);
    }
  },
  onRegisterError(error) {
    console.warn('Attendance Service Worker registration failed:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
