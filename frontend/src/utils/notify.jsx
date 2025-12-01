import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
};

const toastColors = {
  success: "#198754",
  error: "#dc3545",
  info: "#0d6efd",
  warn: "#ffc107",
};

export const notify = {
  success: (msg) => toast.success(msg, { ...defaultOptions, style: { backgroundColor: toastColors.success, color: "white" } }),
  error: (msg) => toast.error(msg, { ...defaultOptions, style: { backgroundColor: toastColors.error, color: "white" } }),
  info: (msg) => toast.info(msg, { ...defaultOptions, style: { backgroundColor: toastColors.info, color: "white" } }),
  warn: (msg) => toast.warn(msg, { ...defaultOptions, style: { backgroundColor: toastColors.warn, color: "black" } }),
};
