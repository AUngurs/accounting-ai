import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { Button, Form } from "react-bootstrap";
import { useAuth } from "../components/AuthContext";
import { userRules } from "../utils/Validators";
import { notify } from "../utils/Notify";

export default function User() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [formData, setFormData] = useState({ email: "", username: "", password: "", repeatPassword: "" });
  const [allowPasswordEdit, setAllowPasswordEdit] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Inicializē formu ar esošajiem lietotāja datiem
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({ ...prev, email: user.email || "", username: user.username || "" }));
    }
  }, [user]);

  // Atjauno formData, kad lietotājs maina ievadi
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined })); // Noņem kļūdu konkrētajā laukā
  };

  // Iespējo vai atspējo paroles maiņu
  const togglePasswordEdit = (checked) => {
    setAllowPasswordEdit(checked);
    if (!checked) {
      setFormData((prev) => ({ ...prev, password: "", repeatPassword: "" })); // Notīra paroles laukus
    }
  };

  // Saglabā lietotāja datus
  const handleSubmit = async () => {
    const errors = userRules(formData, allowPasswordEdit); // Validē ievadītos datus
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return; // Neiesniedz, ja ir kļūdas

    const payload = { username: formData.username.trim() }; // Sagatavo payload
    if (allowPasswordEdit) {
      payload.password = formData.password;
      payload.repeatPassword = formData.repeatPassword;
    }

    try {
      const res = await axiosInstance.put(`/user/${user.id}`, payload); // Sūta pieprasījumu serverim
      setUser((prev) => ({ ...prev, username: res.data.username })); // Atjauno AuthContext ar jauno lietotājvārdu
      notify.success("Lietotāja dati veiksmīgi rediģēti!");
      navigate("/companies"); // Atgriežas uz uzņēmumu sarakstu
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda saglabājot lietotāju");
    }
  };

  // Dzēš lietotāja kontu
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
        <div className="card p-4 shadow" style={{ width: "100%", maxWidth: "400px", borderRadius: "10px", maxHeight: "90vh" }}>
          <Form noValidate>
            {/* E-pasts nevar tikt mainīts */}
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
                isInvalid={!!formErrors.username} // Parāda kļūdu vizuāli
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
                disabled={!allowPasswordEdit} // Atspējo, ja parole nav atļauta
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
                disabled={!allowPasswordEdit} // Atspējo, ja parole nav atļauta
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
