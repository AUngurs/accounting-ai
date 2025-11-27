import { useAuth } from "./AuthContext";

export default function UserCard() {
  const { user } = useAuth();

  return (
    <div className="card mb-1 bg-secondary text-light">
      <div className="card-body p-3">
        <h6 className="card-title mb-1 fw-bold">{user.username}</h6>
        <p className="card-subtitle small">{user.email}</p>
      </div>
    </div>
  );
}
