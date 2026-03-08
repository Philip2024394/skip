import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure light mode only
document.documentElement.classList.remove("dark");

createRoot(document.getElementById("root")!).render(<App />);

// Service worker is registered and update flow is handled in App via useServiceWorkerUpdate
