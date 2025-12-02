import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/AuthContext";
import { notify } from "../utils/notify";
import { loginRules } from "../utils/validators";
import { Button, Form } from "react-bootstrap";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
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
      notify.error("Pieslēgšanās neizdevās!");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#19221C" }}>
      <div className="card p-4 shadow" style={{ width: "100%", maxWidth: "400px", borderRadius: "10px" }}>
        <Form noValidate onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Label>E-pasts</Form.Label>
            <Form.Control type="text" name="email" value={formData.email} onChange={handleChange} isInvalid={!!formErrors.email} />
            <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Parole</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              isInvalid={!!formErrors.password}
            />
            <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
          </Form.Group>

          <Button type="submit" className="btn custom-dark-hover w-100 mb-2">
            Pieslēgties
          </Button>

          <Button type="button" className="btn custom-dark-hover w-100" onClick={() => navigate("/register")}>
            Reģistrēties
          </Button>
        </Form>
      </div>
    </div>
  );
}
