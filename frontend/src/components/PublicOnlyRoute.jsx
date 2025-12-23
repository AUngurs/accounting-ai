import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// PublicOnlyRoute komponenta uzdevums ir aizliegt piekļuvi lapām autentificētiem lietotājiem (piem., login vai register)
export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth(); // Iegūst autentifikācijas stāvokli un ielādes statusu no AuthContext

  // Ja autentifikācijas dati vēl tiek ielādēti, nerāda neko (novērš īslaicīgu redzamo saturu)
  if (loading) return null;

  // Ja lietotājs jau ir autentificēts, pāradresē uz uzņēmumu sarakstu
  if (isAuthenticated) return <Navigate to="/companies" replace />;

  // Ja lietotājs nav autentificēts, atgriež nodoto komponentu
  return children;
}
