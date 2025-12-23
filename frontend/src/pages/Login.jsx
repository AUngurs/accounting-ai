import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../components/AuthContext";
import { notify } from "../utils/Notify";
import { loginRules } from "../utils/Validators";
import { Button, Form } from "react-bootstrap";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formErrors, setFormErrors] = useState({});
  const { login } = useAuth(); // Iegūst login funkciju no AuthContext
  const navigate = useNavigate();

  // Atjauno formData, kad lietotājs maina ievadi
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Apstrādā pieslēgšanos
  const handleLogin = async (e) => {
    e.preventDefault(); // Novērš formas noklusējuma sūtīšanu

    const errors = loginRules(formData); // Validē formu pēc noteikumiem
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return; // Ja ir kļūdas, neiesniedz

    try {
      const res = await axiosInstance.post("/auth/login", formData); // Sūta login pieprasījumu
      const data = res.data;
      login(data.token, data.user); // Saglabā tokenu un lietotāju AuthContext
      notify.success("Pieslēgšanās veiksmīga!");
      navigate("/companies"); // Pāriet uz uzņēmumu sarakstu
    } catch (err) {
      console.error(err);
      notify.error("Pieslēgšanās neizdevās!");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#021526" }}>
      <div className="card p-4 shadow" style={{ width: "100%", maxWidth: "400px", borderRadius: "10px" }}>
        <Form noValidate onSubmit={handleLogin}>
          <Form.Group className="mb-3">
            <Form.Label>E-pasts</Form.Label>
            <Form.Control
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!formErrors.email} // Parāda kļūdu vizuāli
            />
            <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Parole</Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              isInvalid={!!formErrors.password} // Parāda kļūdu vizuāli
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
