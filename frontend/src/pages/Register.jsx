import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { notify } from "../utils/Notify";
import { registerRules } from "../utils/Validators";
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

  // Atjauno formData, kad lietotājs maina ievadi
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Apstrādā reģistrāciju
  const handleRegister = async (e) => {
    e.preventDefault(); // Novērš noklusējuma formas iesniegšanu

    const errors = registerRules(formData); // Validē ievadītos datus
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return; // Ja ir kļūdas, neiesniedz

    try {
      await axiosInstance.post("/auth/register", formData); // Sūta reģistrācijas pieprasījumu
      notify.success("Reģistrācija veiksmīga!");
      navigate("/login"); // Pāriet uz login lapu
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        notify.error(err.response.data.error);
      } else {
        notify.error("Neparedzēta servera kļūda");
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#021526" }}>
      <div className="card p-4 shadow" style={{ width: "100%", maxWidth: "400px", borderRadius: "10px" }}>
        <h3 className="text-center mb-4">Reģistrēties</h3>

        <Form noValidate onSubmit={handleRegister}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="email">E-pasts</Form.Label>
            <Form.Control
              type="text"
              name="email"
              id="email"
              autoComplete="off"
              value={formData.email}
              onChange={handleChange}
              isInvalid={!!formErrors.email} // Parāda kļūdu vizuāli
            />
            <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="username">Lietotājvārds</Form.Label>
            <Form.Control
              type="text"
              name="username"
              id="username"
              autoComplete="off"
              value={formData.username}
              onChange={handleChange}
              isInvalid={!!formErrors.username} // Parāda kļūdu vizuāli
            />
            <Form.Control.Feedback type="invalid">{formErrors.username}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="password">Parole</Form.Label>
            <Form.Control
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              isInvalid={!!formErrors.password} // Parāda kļūdu vizuāli
            />
            <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="repeatPassword">Atkārtota parole</Form.Label>
            <Form.Control
              type="password"
              name="repeatPassword"
              id="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              isInvalid={!!formErrors.repeatPassword} // Parāda kļūdu vizuāli
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
