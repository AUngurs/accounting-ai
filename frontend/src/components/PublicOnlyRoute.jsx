import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/companies" replace />;
  return children;
}
