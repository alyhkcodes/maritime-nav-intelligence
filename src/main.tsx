import 'leaflet/dist/leaflet.css';
import './styles/theme.css';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(<App />);
