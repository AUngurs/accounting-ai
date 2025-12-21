import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { Button, Form } from "react-bootstrap";
import { useAuth } from "../components/AuthContext";
import { userRules } from "../utils/validators";
import { notify } from "../utils/notify";

export default function User() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    repeatPassword: "",
  });

  const [allowPasswordEdit, setAllowPasswordEdit] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        username: user.username || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const togglePasswordEdit = (checked) => {
    setAllowPasswordEdit(checked);

    if (!checked) {
      setFormData((prev) => ({
        ...prev,
        password: "",
        repeatPassword: "",
      }));
    }
  };

  const handleSubmit = async () => {
    const errors = userRules(formData, allowPasswordEdit);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = { username: formData.username };

    if (allowPasswordEdit && formData.password) {
      payload.password = formData.password;
    }

    try {
      const res = await axiosInstance.put(`/user/${user.id}`, payload);
      setUser((prev) => ({ ...prev, username: res.data.username }));
      notify.success("Lietotāja dati veiksmīgi rediģēti!");
      navigate("/companies");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda saglabājot lietotāju");
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
      alert(err.response?.data?.error || "Kļūda dzēšot lietotāju");
    }
  };

  return (
    <React.Fragment>
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#021526" }}>
        <div
          className="card p-4 shadow"
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "10px",
            maxHeight: "90vh",
          }}
        >
          <Form noValidate>
            <Form.Group className="mb-2">
              <Form.Label>E-pasts</Form.Label>
              <Form.Control name="email" value={formData.email} disabled></Form.Control>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Lietotājvārds</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                isInvalid={!!formErrors.username}
              />
              <Form.Control.Feedback type="invalid">{formErrors.username}</Form.Control.Feedback>
            </Form.Group>

            <Form.Check
              type="checkbox"
              id="enablePasswordEdit"
              label="Mainīt paroli"
              className="mt-5"
              checked={allowPasswordEdit}
              onChange={(e) => togglePasswordEdit(e.target.checked)}
            />

            <Form.Group className="mb-2">
              <Form.Label>Jauna parole</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!formErrors.password}
                disabled={!allowPasswordEdit}
              />
              <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Atkārtota jauna parole</Form.Label>
              <Form.Control
                type="password"
                name="repeatPassword"
                value={formData.repeatPassword}
                onChange={handleChange}
                isInvalid={!!formErrors.repeatPassword}
                disabled={!allowPasswordEdit}
              />
              <Form.Control.Feedback type="invalid">{formErrors.repeatPassword}</Form.Control.Feedback>
            </Form.Group>
          </Form>
          <div className="d-flex justify-content-end gap-2 mt-3">
            <Button className="custom-red-hover" onClick={handleDelete}>
              Dzēst
            </Button>
            <Button className="custom-dark-hover" onClick={() => navigate("/companies")}>
              Atcelt
            </Button>
            <Button className="custom-dark-hover" onClick={handleSubmit}>
              Saglabāt
            </Button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
