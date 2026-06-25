import { useAuth } from "./AuthContext";

export default function UserCard() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = (user.username || "U").slice(0, 2).toUpperCase();

  return (
    <div className="companies-user-info">
      <div className="companies-avatar">{initials}</div>
      <div>
        <div className="companies-user-name">{user.username}</div>
        <div className="companies-user-email">{user.email}</div>
      </div>
    </div>
  );
}
