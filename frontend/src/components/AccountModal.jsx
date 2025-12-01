import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { accountRules } from "../utils/validators";

export default function AccountModal({ show, handleClose, account, onSave, onDelete, accounts }) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "",
    category: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const typeOptions = ["Analītiskais", "Sintētiskais"];
  const categoryOptions = ["Aktīva", "Pasīva", "Operāciju"];

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
      });
    }
  }, [account, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined })); // remove error on edit
  };

  const handleSubmit = () => {
    const errors = accountRules(accounts, { ...account, ...formData }); // accounts = current state array
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSave({ ...account, ...formData, code: formData.code.trim(), name: formData.name.trim() });
    handleClose();
  };

  const handleDelete = async () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo kontu?")) return;
    onDelete(account.id);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Rediģēt kontu</Modal.Title>
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
            <Form.Label>Kods</Form.Label>
            <Form.Control type="text" name="code" value={formData.code} onChange={handleChange} isInvalid={!!formErrors.code} />
            <Form.Control.Feedback type="invalid">{formErrors.code}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Nosaukums</Form.Label>
            <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!formErrors.name} />
            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Analītiskais/Sintētiskais</Form.Label>
            <Form.Select name="type" value={formData.type} onChange={handleChange} isInvalid={!!formErrors.type}>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.type}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Aktīva/Pasīva/Operāciju</Form.Label>
            <Form.Select name="category" value={formData.category} onChange={handleChange} isInvalid={!!formErrors.category}>
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.category}</Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button className="custom-red-hover" onClick={handleDelete}>
          Dzēst
        </Button>
        <Button className="custom-dark-hover" onClick={handleClose}>
          Atcelt
        </Button>
        <Button type="submit" className="custom-dark-hover" onClick={handleSubmit}>
          Saglabāt
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
