import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { registerSW } from 'virtual:pwa-register'

import Root from "./Root.jsx";

registerSW({ immediate: true })


createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
      <Root />
  // </React.StrictMode>
);
