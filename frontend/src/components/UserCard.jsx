import { useAuth } from "./AuthContext";
import "../styles/Sidebar.css";

export default function UserCard() {
  const { user } = useAuth();

  return (
    <div className="user-card">
      <div className="user-card-body">
        <h6 className="user-card-title">{user.username}</h6>
        <p className="user-card-subtitle">{user.email}</p>
      </div>
    </div>
  );
}
