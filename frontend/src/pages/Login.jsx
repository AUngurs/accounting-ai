import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/AuthContext";
import { notify } from "../utils/notify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axiosInstance.post("/auth/login", { email, password });
      const data = res.data;
      login(data.token, data.user);
      notify.success("Pieslēgšanās veiksmīga!");
      navigate("/companies");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <React.Fragment>
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#19221C" }}>
        <div
          className="card p-4 shadow"
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "10px",
          }}
        >
          <h3 className="text-center mb-4">Grāmatvedība</h3>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                E-pasts
              </label>
              <input type="email" className="form-control" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Parole
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-2">
              Pieslēgties
            </button>

            <button type="button" className="btn btn-secondary w-100" onClick={() => navigate("/register")}>
              Reģistrēties
            </button>
          </form>
        </div>
      </div>
    </React.Fragment>
  );
}
