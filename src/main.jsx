import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import "./i18n";
import "./index.css";
import useAuthStore from "./store/authStore";

useAuthStore.getState().loadFromStorage();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: "border border-ink-200 bg-white text-ink-900 shadow-soft",
          duration: 3500,
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
