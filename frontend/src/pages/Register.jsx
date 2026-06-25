import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { notify } from "../utils/Notify";
import { registerRules } from "../utils/Validators";
import { Form } from "react-bootstrap";

export default function Register() {
  const [formData, setFormData] = useState({ email: "", username: "", password: "", repeatPassword: "" });
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errors = registerRules(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await axiosInstance.post("/auth/register", formData);
      notify.success("Reģistrācija veiksmīga!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error) {
        notify.error(err.response.data.error);
      } else {
        notify.error("Neparedzēta servera kļūda");
      }
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div>
          <div className="auth-brand-logo">Accounting<span>AI</span></div>
          <div className="auth-brand-tagline">
            Izveidojiet kontu un sāciet pārvaldīt savus finanšu dokumentus jau šodien
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-form-title">Izveidot kontu</div>
          <div className="auth-form-subtitle">Aizpildiet zemāk esošo formu</div>

          <Form noValidate onSubmit={handleRegister}>
            <Form.Group className="mb-3">
              <Form.Label className="auth-form-label">E-pasts</Form.Label>
              <Form.Control className="auth-input" type="text" name="email" id="email" autoComplete="off"
                value={formData.email} onChange={handleChange} isInvalid={!!formErrors.email} placeholder="jusu@epasts.lv" />
              <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="auth-form-label">Lietotājvārds</Form.Label>
              <Form.Control className="auth-input" type="text" name="username" id="username" autoComplete="off"
                value={formData.username} onChange={handleChange} isInvalid={!!formErrors.username} placeholder="jusuVards" />
              <Form.Control.Feedback type="invalid">{formErrors.username}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="auth-form-label">Parole</Form.Label>
              <Form.Control className="auth-input" type="password" name="password" id="password"
                value={formData.password} onChange={handleChange} isInvalid={!!formErrors.password} placeholder="••••••••" />
              <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="auth-form-label">Atkārtota parole</Form.Label>
              <Form.Control className="auth-input" type="password" name="repeatPassword" id="repeatPassword"
                value={formData.repeatPassword} onChange={handleChange} isInvalid={!!formErrors.repeatPassword} placeholder="••••••••" />
              <Form.Control.Feedback type="invalid">{formErrors.repeatPassword}</Form.Control.Feedback>
            </Form.Group>

            <button type="submit" className="btn-app auth-submit-btn">
              Reģistrēties
            </button>
          </Form>

          <div className="auth-link-row">
            Jau ir konts?{" "}
            <button className="auth-link" onClick={() => navigate("/login")}>
              Pieslēgties
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
