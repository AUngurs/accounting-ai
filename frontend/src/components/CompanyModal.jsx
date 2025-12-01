import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { companyRules } from "../utils/validators";

export default function EditCompanyModal({ show, handleClose, company, onSave, onDelete, companies }) {
  const isEditMode = !!company;

  const [formData, setFormData] = useState({
    name: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (company) {
      setFormData({ name: company.name });
    } else {
      setFormData({ name: "" });
    }
    setFormErrors({});
  }, [company, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = () => {
    const errors = companyRules(companies, formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    onSave({ ...company, ...formData, name: formData.name.trim() });
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
        <Modal.Title>{isEditMode ? "Rediģēt uzņēmumu" : "Pievienot uzņēmumu"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Form.Group className="mb-2">
            <Form.Label>Uzņēmuma nosaukums</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              isInvalid={!!formErrors.name}
              placeholder="Ievadiet uzņēmuma nosaukumu"
            />
            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        {isEditMode && (
          <Button className="custom-red-hover" onClick={handleDelete}>
            Dzēst
          </Button>
        )}
        <Button className="custom-dark-hover" onClick={handleClose}>
          Atcelt
        </Button>
        <Button type="submit" className="custom-dark-hover" onClick={handleSubmit}>
          {isEditMode ? "Saglabāt" : "Pievienot"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
