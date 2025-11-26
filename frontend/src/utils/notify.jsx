import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Default options to match Bootstrap styling
const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored", // enables colored backgrounds
};

// Custom Bootstrap-like colors
const toastColors = {
  success: "#198754", // Bootstrap green
  error: "#dc3545", // Bootstrap red
  info: "#0d6efd", // Bootstrap blue
  warn: "#ffc107", // Bootstrap yellow
};

export const notify = {
  success: (msg) => toast.success(msg, { ...defaultOptions, style: { backgroundColor: toastColors.success, color: "white" } }),

  error: (msg) => toast.error(msg, { ...defaultOptions, style: { backgroundColor: toastColors.error, color: "white" } }),

  info: (msg) => toast.info(msg, { ...defaultOptions, style: { backgroundColor: toastColors.info, color: "white" } }),

  warn: (msg) => toast.warn(msg, { ...defaultOptions, style: { backgroundColor: toastColors.warn, color: "black" } }),
};
