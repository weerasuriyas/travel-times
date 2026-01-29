import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Temporarily disable StrictMode to avoid double-mounting during OAuth
// StrictMode causes initialization to run twice, which creates AbortErrors
createRoot(document.getElementById('root')).render(
  <App />
)
