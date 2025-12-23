import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// ProtectedRoute komponenta uzdevums ir aizsargāt routes, ļaujot piekļuvi tikai autentificētiem lietotājiem
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth(); // Iegūst autentifikācijas stāvokli un ielādes statusu no AuthContext

  // Ja autentifikācijas dati vēl tiek ielādēti, nerāda neko (novērš īslaicīgu redzamo saturu)
  if (loading) return null;

  // Ja lietotājs nav autentificēts, pāradresē uz login lapu
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Ja lietotājs ir autentificēts, atgriež nodoto komponentu
  return children;
}
