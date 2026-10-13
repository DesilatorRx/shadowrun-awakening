import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { track } from './analytics'

// Counts both the Print buttons and the browser's own Print command.
window.addEventListener('beforeprint', () => track('print', 'Printed a sheet'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
