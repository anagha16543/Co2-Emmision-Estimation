import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

// Force dark mode by default using the `dark` class on the root element.
document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </>
  </React.StrictMode>
);