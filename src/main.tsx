import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure light mode only
document.documentElement.classList.remove("dark");

// Set mobile viewport constraints
const viewport = document.querySelector('meta[name="viewport"]');
if (viewport) {
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
} else {
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
  document.head.appendChild(meta);
}

// Prevent desktop zoom behavior
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById("root")!).render(<div className="app-container"><App /></div>);

// Service worker is registered and update flow is handled in App via useServiceWorkerUpdate
