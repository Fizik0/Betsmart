import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// CSS переменные устанавливаются через Tailwind и CSS классы в index.css

// Устанавливаем дополнительные переменные, которые не определены в index.css
document.documentElement.style.setProperty('--win', '15 157 88');
document.documentElement.style.setProperty('--loss', '231 76 60');
document.documentElement.style.setProperty('--pending', '243 156 18');

createRoot(document.getElementById("root")!).render(<App />);
