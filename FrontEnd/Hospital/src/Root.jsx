import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeProvider.jsx";
import { AuthProvider } from "./context/AuthProvider";
import { SocketProvider } from "./context/SocketProvider.jsx";

import App from "./App.jsx";
import Toast from "./components/ui/Toast.jsx";
import { registerToastHandler } from "./utils/toastBus.js";

export default function Root() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    registerToastHandler(setToast);
  }, []);

  return (
    <BrowserRouter>
      <SocketProvider>
        <AuthProvider>
          <ThemeProvider>
            <App />

            {toast && (
              <Toast
                type={toast.type}
                message={toast.message}
                onClose={() => setToast(null)}
              />
            )}
          </ThemeProvider>
        </AuthProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}
