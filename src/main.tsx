import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AxionProvider } from "@/contexts/AxionContext";

createRoot(document.getElementById("root")!).render(
  <AxionProvider>
    <App />
  </AxionProvider>
);
