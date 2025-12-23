import { useAuth } from "./AuthContext";
import "../styles/Sidebar.css";

// UserCard komponents attēlo pašreizējo lietotāju sidebarā vai companies skatā
export default function UserCard() {
  const { user } = useAuth(); // Iegūst lietotāja datus no AuthContext

  return (
    <div className="user-card">
      <div className="user-card-body">
        {/* Attēlo lietotāja lietotājvārdu */}
        <h6 className="user-card-title">{user.username}</h6>
        {/* Attēlo lietotāja e-pastu */}
        <p className="user-card-subtitle">{user.email}</p>
      </div>
    </div>
  );
}
