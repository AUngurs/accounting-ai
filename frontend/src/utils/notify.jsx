import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Noklusējuma opcijas visiem paziņojumiem
const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
};

// Krāsas atsevišķiem paziņojumu tipiem
const toastColors = {
  success: "#cfe3f2",
  error: "#dc3545",
  info: "#03346e",
  warn: "#ffc107",
};

// Paziņojumu funkcijas, kas izmanto React-Toastify ar pielāgotām krāsām un stilu
export const notify = {
  success: (msg) => toast.success(msg, { ...defaultOptions, style: { backgroundColor: toastColors.success, color: "black" } }),
  error: (msg) => toast.error(msg, { ...defaultOptions, style: { backgroundColor: toastColors.error, color: "white" } }),
  info: (msg) => toast.info(msg, { ...defaultOptions, style: { backgroundColor: toastColors.info, color: "white" } }),
  warn: (msg) => toast.warn(msg, { ...defaultOptions, style: { backgroundColor: toastColors.warn, color: "black" } }),
};
