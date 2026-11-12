import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/app.css'
import App from './App'

try {
  const t = localStorage.getItem('ettp-theme')
  if (t) document.documentElement.dataset.theme = t
} catch {
  /* */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
