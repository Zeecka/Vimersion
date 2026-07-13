import ReactDOM from 'react-dom/client'
import App from './App'
// Self-hosted fonts (no Google Fonts request — the app works fully offline).
import '@fontsource-variable/space-grotesk'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import './styles/index.css'

// Note: intentionally NOT wrapped in <React.StrictMode>. StrictMode double-invokes
// mount effects in dev, which would double-initialise the CodeMirror view and
// double-count keystrokes in the VimEditor. The editor still cleans up correctly on
// real unmount; we just avoid the dev-only double-fire.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
