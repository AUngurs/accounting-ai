import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { notify } from "../utils/notify";
import { registerRules } from "../utils/validators";
import { Button, Form } from "react-bootstrap";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    repeatPassword: "",
  });
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
      notify.error("Reģistrācija neizdevās!");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#021526" }}>
      <div className="card p-4 shadow" style={{ width: "100%", maxWidth: "400px", borderRadius: "10px" }}>
        <h3 className="text-center mb-4">Reģistrēties</h3>

        <Form noValidate onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Label>E-pasts</Form.Label>
            <Form.Control type="text" name="email" value={formData.email} onChange={handleChange} isInvalid={!!formErrors.email} />
            <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Lietotājvārds</Form.Label>
            <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} isInvalid={!!formErrors.username} />
            <Form.Control.Feedback type="invalid">{formErrors.username}</Form.Control.Feedback>
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

          <Form.Group className="mb-3">
            <Form.Label>Atkārtota parole</Form.Label>
            <Form.Control
              type="password"
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              isInvalid={!!formErrors.repeatPassword}
            />
            <Form.Control.Feedback type="invalid">{formErrors.repeatPassword}</Form.Control.Feedback>
          </Form.Group>

          <Button type="submit" className="btn custom-dark-hover w-100 mb-2">
            Reģistrēties
          </Button>
          <Button type="button" className="btn custom-dark-hover w-100" onClick={() => navigate("/login")}>
            Atpakaļ
          </Button>
        </Form>
      </div>
    </div>
  );
}
