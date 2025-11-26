import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function EditCompanyModal({ show, handleClose, company, onSave, onDelete, companies }) {
  const [formData, setFormData] = useState({
    name: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
      });
    }
  }, [company]);

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Nosaukums nedrīkst būt tukšs";
    }

    const exists = companies.some((c) => c.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && c.id !== company.id);
    if (exists) {
      errors.name = "Uzņēmums ar šādu nosaukumu jau eksistē";
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSave({ ...company, ...formData });
    handleClose();
  };

  const handleDelete = () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo uzņēmumu?")) return;

    onDelete(company.id);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Rediģēt uzņēmumu</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Uzņēmuma nosaukums</Form.Label>
            <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!formErrors.name} />
            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="danger" onClick={handleDelete}>
          Dzēst
        </Button>
        <Button variant="secondary" onClick={handleClose}>
          Atcelt
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Saglabāt
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
