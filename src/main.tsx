import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { useStore } from './store'
import { watchTheme } from './lib/theme'

// antes de pintar, para que no se vea un parpadeo de color
watchTheme(() => useStore.getState().settings, (fn) => useStore.subscribe((s, prev) => s.settings !== prev.settings && fn()))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
