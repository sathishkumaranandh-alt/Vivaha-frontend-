import React from "react";
import ReactDOM from "react-dom/client";
import './index.css';
import "./styles/global.css";
import "./styles/glass-theme.css";
import { initGlassTheme } from "./utils/glassTheme";
import { applyCachedVgTheme } from "./utils/vgThemes";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import { initMonitoring } from "./utils/monitoring";
import ToastContainer from "./components/ToastContainer";

initMonitoring();
applyCachedVgTheme();
initGlassTheme();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <ToastContainer />
    </ErrorBoundary>
  </React.StrictMode>
);
