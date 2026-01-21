// src/utils/toastBus.js

let toastHandler = null;

/**
 * Register the React setToast function once (in main.jsx)
 */
export const registerToastHandler = (handler) => {
  toastHandler = handler;
};

/**
 * Call this anywhere (axios interceptor, services, etc.)
 * to show a toast globally.
 */
export const showToast = ({ type = "success", message }) => {
  if (toastHandler) {
    toastHandler({ type, message });
  }
};
