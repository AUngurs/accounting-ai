import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { Form } from "react-bootstrap";
import { useAuth } from "../components/AuthContext";
import { userRules } from "../utils/Validators";
import { notify } from "../utils/Notify";

export default function User() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [formData, setFormData] = useState({ email: "", username: "", password: "", repeatPassword: "" });
  const [allowPasswordEdit, setAllowPasswordEdit] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, email: user.email || "", username: user.username || "" }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const togglePasswordEdit = (checked) => {
    setAllowPasswordEdit(checked);
    if (!checked) setFormData((prev) => ({ ...prev, password: "", repeatPassword: "" }));
  };

  const handleSubmit = async () => {
    const errors = userRules(formData, allowPasswordEdit);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const payload = { username: formData.username.trim() };
    if (allowPasswordEdit) {
      payload.password = formData.password;
      payload.repeatPassword = formData.repeatPassword;
    }
    try {
      const res = await axiosInstance.put(`/user/${user.id}`, payload);
      setUser((prev) => ({ ...prev, username: res.data.username }));
      notify.success("Lietotāja dati veiksmīgi rediģēti!");
      navigate("/companies");
    } catch (err) {
      console.error(err);
      notify.error("Neparedzēta servera kļūda");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst savu kontu?")) return;
    try {
      await axiosInstance.delete(`/user/${user.id}`);
      logout();
      notify.success("Lietotājs veiksmīgi dzēsts!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      notify.error("Neparedzēta servera kļūda");
    }
  };

  return (
    <div className="user-profile-shell">
      <div className="user-profile-panel">
        <div className="user-profile-heading">Profila iestatījumi</div>

        <Form noValidate>
          <Form.Group className="mb-3">
            <Form.Label className="auth-form-label">E-pasts</Form.Label>
            <Form.Control
              className="auth-input"
              name="email" id="email"
              value={formData.email}
              autoComplete="off"
              disabled
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="auth-form-label">Lietotājvārds</Form.Label>
            <Form.Control
              className="auth-input"
              type="text" name="username" id="username"
              autoComplete="off"
              value={formData.username}
              onChange={handleChange}
              isInvalid={!!formErrors.username}
            />
            <Form.Control.Feedback type="invalid">{formErrors.username}</Form.Control.Feedback>
          </Form.Group>

          <div style={{ borderTop: "1px solid var(--border)", margin: "1.25rem 0 1rem" }} />

          <Form.Check
            type="checkbox"
            id="enablePasswordEdit"
            label="Mainīt paroli"
            className="mb-3"
            checked={allowPasswordEdit}
            onChange={(e) => togglePasswordEdit(e.target.checked)}
          />

          <Form.Group className="mb-3">
            <Form.Label className="auth-form-label">Jauna parole</Form.Label>
            <Form.Control
              className="auth-input"
              type="password" name="password" id="password"
              value={formData.password}
              onChange={handleChange}
              isInvalid={!!formErrors.password}
              disabled={!allowPasswordEdit}
              placeholder="••••••••"
            />
            <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="auth-form-label">Atkārtota jauna parole</Form.Label>
            <Form.Control
              className="auth-input"
              type="password" name="repeatPassword" id="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              isInvalid={!!formErrors.repeatPassword}
              disabled={!allowPasswordEdit}
              placeholder="••••••••"
            />
            <Form.Control.Feedback type="invalid">{formErrors.repeatPassword}</Form.Control.Feedback>
          </Form.Group>
        </Form>

        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
          <button className="btn-app-danger" onClick={handleDelete}>Dzēst kontu</button>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-app-outline" onClick={() => navigate("/companies")}>Atcelt</button>
            <button className="btn-app" onClick={handleSubmit}>Saglabāt</button>
          </div>
        </div>
      </div>
    </div>
  );
}
