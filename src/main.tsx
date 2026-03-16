import { createRoot } from "react-dom/client";
import AppEmergency from "./AppEmergency.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

// Ensure light mode only
document.documentElement.classList.remove("dark");

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <AppEmergency />
    </ErrorBoundary>
);