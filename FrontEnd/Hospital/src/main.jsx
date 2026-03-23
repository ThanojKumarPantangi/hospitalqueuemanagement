import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { registerSW } from 'virtual:pwa-register'

import Root from "./Root.jsx";

registerSW({ immediate: true })

import { Provider } from "react-redux";
import {store} from "@/store/store.js";

createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <Provider store={store}>
      <Root />
    </Provider>
  // </React.StrictMode>
);
