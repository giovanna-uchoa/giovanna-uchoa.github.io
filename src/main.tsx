import React from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "./theme/ThemeProvider.tsx";
import { LanguageProvider } from "./i18n/LanguageProvider.tsx";
import App from "./App.tsx";

// Old links used HashRouter (/#/post/15). Rewrite them to path URLs before the router mounts.
const legacyHashRoute = window.location.hash.match(/^#(\/.*)$/);
if (legacyHashRoute) {
  window.history.replaceState(null, '', legacyHashRoute[1]);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);