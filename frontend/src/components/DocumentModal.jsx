import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const docTypeOptions = [
  { value: "Čeks", label: "Čeks" },
  { value: "Grām.", label: "Grāmatojums" },
  { value: "Ienāk.b.dok.", label: "Ienākošais bankas dokuments" },
  { value: "Izej.b.dok.", label: "Izejošais bankas dokuments" },
  { value: "Rēķ", label: "Rēķins" },
];
const docGroupOptions = [
  { value: "-", label: "-" },
  { value: "D", label: "Debeta parāds" },
  { value: "DA", label: "Debeta apmaksa" },
  { value: "K", label: "Kredīta parāds" },
  { value: "KA", label: "Kredīta apmaksa" },
];
const docCurrencyOptions = ["EUR", "DKK", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];

export default function DocumentModal({ show, handleClose, documentData, onSave, onDelete, partners }) {
  const isEditMode = !!documentData;

  const [formData, setFormData] = useState({
    doc_id: "",
    doc_date: "",
    doc_type_abbrev: "",
    doc_group_abbrev: "",
    doc_currency: "EUR",
    doc_amount: "",
    doc_comments: "",
    is_accounted: false,
    partner_id: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEditMode && show) {
      const initialData = {
        doc_id: documentData.doc_id || "",
        doc_date: documentData.doc_date || "",
        doc_type_abbrev: documentData.doc_type_abbrev || "",
        doc_group_abbrev: documentData.doc_group_abbrev || "",
        doc_currency: documentData.doc_currency || "EUR",
        doc_amount: documentData.doc_amount || "",
        doc_comments: documentData.doc_comments || "",
        is_accounted: documentData.is_accounted || false,
        partner_id: documentData.partner_id || "",
      };
      setFormData(initialData);
      setFormErrors({});
    } else if (!isEditMode && show) {
      // Reset for creation
      setFormData({
        doc_id: "",
        doc_date: "",
        doc_type_abbrev: docTypeOptions[0].value || "",
        doc_group_abbrev: docGroupOptions[0].value || "",
        doc_currency: "EUR",
        doc_amount: "",
        doc_comments: "",
        is_accounted: false,
        partner_id: "",
      });
      setFormErrors({});
    }
  }, [isEditMode, documentData, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = () => {
    // TODO: add validation logic here if needed
    onSave({ ...documentData, ...formData });
    handleClose();
  };

  const handleCancel = () => {
    handleClose();
  };

  const handleDelete = () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo dokumentu?")) return;
    onDelete(documentData.id);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleCancel}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Rediģēt dokumentu" : "Pievienot jaunu dokumentu"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Dokumenta numurs</Form.Label>
            <Form.Control type="text" name="doc_id" value={formData.doc_id} onChange={handleChange} isInvalid={!!formErrors.doc_id} />
            <Form.Control.Feedback type="invalid">{formErrors.doc_id}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Datums</Form.Label>
            <Form.Control
              type="date"
              name="doc_date"
              value={formData.doc_date.slice(0, 10)}
              onChange={handleChange}
              isInvalid={!!formErrors.doc_date}
            />
            <Form.Control.Feedback type="invalid">{formErrors.doc_date}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Dokumenta tips</Form.Label>
            <Form.Select
              name="doc_type_abbrev"
              value={formData.doc_type_abbrev}
              onChange={handleChange}
              isInvalid={!!formErrors.doc_type_abbrev}
            >
              {docTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.doc_type_abbrev}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Dokumenta grupa</Form.Label>
            <Form.Select
              name="doc_group_abbrev"
              value={formData.doc_group_abbrev}
              onChange={handleChange}
              isInvalid={!!formErrors.doc_group_abbrev}
            >
              {docGroupOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.doc_group_abbrev}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Valūta</Form.Label>
            <Form.Select name="doc_currency" value={formData.doc_currency} onChange={handleChange} isInvalid={!!formErrors.doc_currency}>
              {docCurrencyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.doc_currency}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Summa</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              name="doc_amount"
              value={formData.doc_amount}
              onChange={handleChange}
              isInvalid={!!formErrors.doc_amount}
            />
            <Form.Control.Feedback type="invalid">{formErrors.doc_amount}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Partneris</Form.Label>
            <Form.Select name="partner_id" value={formData.partner_id || ""} onChange={handleChange} isInvalid={!!formErrors.partner_id}>
              <option value=""></option>
              {partners
                ?.slice()
                .sort((a, b) => (a.formatted_name || "").localeCompare(b.formatted_name || "", "lv", { sensitivity: "base" }))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.formatted_name}
                  </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.partner_id}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Piezīmes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="doc_comments"
              value={formData.doc_comments}
              onChange={handleChange}
              isInvalid={!!formErrors.doc_comments}
            />
            <Form.Control.Feedback type="invalid">{formErrors.doc_comments}</Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        {isEditMode && (
          <Button className="custom-red-hover" onClick={handleDelete}>
            Dzēst
          </Button>
        )}
        <Button className="custom-dark-hover" onClick={handleCancel}>
          Atcelt
        </Button>
        <Button className="custom-dark-hover" onClick={handleSubmit}>
          {isEditMode ? "Saglabāt" : "Pievienot"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
