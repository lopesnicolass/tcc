import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GamificationProvider } from './context/GamificationContext.jsx';
import './styles/global.css';
import './styles/App.css';
import App from './App.jsx';
import './styles/dark-mode.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GamificationProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GamificationProvider>
  </StrictMode>,
);