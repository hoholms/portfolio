import "./style.css";
import { CustomCursor } from "./CustomCursor.js";

// Initialize the custom cursor on DOM content loaded.
document.addEventListener("DOMContentLoaded", () => {
  new CustomCursor();
});
