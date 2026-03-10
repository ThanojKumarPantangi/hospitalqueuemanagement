import React from "react";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { createRoot } from "react-dom/client";
import "./index.css";

import Root from "./Root.jsx";

createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <Root />
  // </React.StrictMode>
);
