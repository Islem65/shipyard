//Ce code dans main.tsx permet de démarrer ton application React, de charger App.tsx et de préparer la navigation entre les pages avec React Router.
import { StrictMode } from 'react'
//Permet à React de démarrer et d'afficher l'interface dans la page HTML.
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
// BrowserRouter permet la navigation entre les URL.
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
