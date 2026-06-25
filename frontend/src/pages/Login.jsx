import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/AuthContext";
import { notify } from "../utils/Notify";
import { loginRules } from "../utils/Validators";
import { Form } from "react-bootstrap";
import { IoDocumentText } from "react-icons/io5";
import { MdBusinessCenter } from "react-icons/md";
import { FaChartBar } from "react-icons/fa6";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errors = loginRules(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await axiosInstance.post("/auth/login", formData);
      const data = res.data;
      login(data.token, data.user);
      notify.success("Pieslēgšanās veiksmīga!");
      navigate("/companies");
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
            Moderna grāmatvedības platforma ar mākslīgā intelekta atbalstu
          </div>
        </div>
        <div className="auth-brand-features">
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><IoDocumentText /></div>
            <div className="auth-brand-feature-text">
              <strong>Dokumentu pārvaldība</strong>
              Automātiska PDF apstrāde ar AI
            </div>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><MdBusinessCenter /></div>
            <div className="auth-brand-feature-text">
              <strong>Partneru reģistrs</strong>
              Pilnīgs kontaktpersonu saraksts
            </div>
          </div>
          <div className="auth-brand-feature">
            <div className="auth-brand-feature-icon"><FaChartBar /></div>
            <div className="auth-brand-feature-text">
              <strong>Kontu plāns</strong>
              Strukturēta finanšu uzskaite
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-form-title">Laipni lūdzam</div>
          <div className="auth-form-subtitle">Pieslēdzieties savam kontam</div>

          <Form noValidate onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label className="auth-form-label">E-pasts</Form.Label>
              <Form.Control
                className="auth-input"
                type="text"
                name="email"
                id="email"
                autoComplete="off"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!formErrors.email}
                placeholder="jusu@epasts.lv"
              />
              <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="auth-form-label">Parole</Form.Label>
              <Form.Control
                className="auth-input"
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!formErrors.password}
                placeholder="••••••••"
              />
              <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
            </Form.Group>

            <button type="submit" className="btn-app auth-submit-btn">
              Pieslēgties
            </button>
          </Form>

          <div className="auth-link-row">
            Nav konta?{" "}
            <button className="auth-link" onClick={() => navigate("/register")}>
              Reģistrēties
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
