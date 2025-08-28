import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MediaLightboxProvider } from './components/common/MediaLightboxProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MediaLightboxProvider>
      <App />
    </MediaLightboxProvider>
  </StrictMode>,
)
