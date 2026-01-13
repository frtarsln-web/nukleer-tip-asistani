import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { PatientNotesProvider } from './contexts/PatientNotesContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <PatientNotesProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </PatientNotesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
