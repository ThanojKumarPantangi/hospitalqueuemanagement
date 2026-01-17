import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from "./context/ThemeProvider.jsx";
import { AuthProvider } from "./context/AuthProvider";
import { SocketProvider } from "./context/SocketProvider.jsx";
import App from './App.jsx'
import { BrowserRouter} from "react-router-dom";


createRoot(document.getElementById('root')).render(
  // <StrictMode>
     <BrowserRouter>
        <SocketProvider>
          <AuthProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AuthProvider>
        </SocketProvider>
    </BrowserRouter>
  // </StrictMode>,
)