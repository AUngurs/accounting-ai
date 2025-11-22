import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== repeatPassword) {
      setError("Paroles nesakrīt");
      return;
    }

    try {
      const res = await axiosInstance.post("/auth/register", {
        email,
        username,
        password,
        repeatPassword,
      });
      navigate("/login");
    } catch (err) {
      if (err.response && err.response.data) {
        const data = err.response.data;
        setError(
          data.error || data.errors?.[0]?.msg || "Reģistrācija neizdevās"
        );
      } else {
        setError("Servera kļūda, mēģiniet vēlreiz");
      }
      console.error(err);
    }
  };

  return (
    <React.Fragment>
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", backgroundColor: "#19221C" }}
      >
        <div
          className="card p-4 shadow"
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "10px",
          }}
        >
          <h3 className="text-center mb-4">Reģistrēties</h3>
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                E-pasts
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Lietotājvārds
              </label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
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

            <div className="mb-3">
              <label htmlFor="repeat-password" className="form-label">
                Atkārtota parole
              </label>
              <input
                type="password"
                className="form-control"
                id="repeat-password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 mb-2">
              Reģistrēties
            </button>

            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={() => navigate("/login")}
            >
              Atpakaļ
            </button>
          </form>
        </div>
      </div>
    </React.Fragment>
  );
}
