import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function EditDocumentModal({
  show,
  handleClose,
  documentData,
  onSave,
  onDelete,
  partners, // partner list for dropdown
}) {
  // formData will always store the current form state
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

  // Store the original document to reset if needed
  const [originalFormData, setOriginalFormData] = useState(null);

  const docTypeOptions = ["Čeks", "Grām.", "Ienāk.b.dok.", "Izej.b.dok.", "Kredītrēķ.", "Rēķ"];
  const docGroupOptions = ["-", "D", "DA", "K", "KA"];
  const docCurrencyOptions = ["DKK", "EUR", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];

  // Whenever a new document is opened, populate the form and store original
  useEffect(() => {
    if (documentData && show) {
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
      setOriginalFormData(initialData); // store original
      setFormErrors({});
    }
  }, [documentData, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = () => {
    onSave({ ...documentData, ...formData });
    handleClose();
  };

  const handleCancel = () => {
    // Reset formData to original before closing
    if (originalFormData) setFormData(originalFormData);
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
        <Modal.Title>Rediģēt dokumentu</Modal.Title>
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
              value={formData.doc_date.slice(0, 10)} // YYYY-MM-DD
              onChange={handleChange}
              isInvalid={!!formErrors.doc_date}
            />
            <Form.Control.Feedback type="invalid">{formErrors.doc_date}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Tipa abreviatūra</Form.Label>
            <Form.Select
              name="doc_type_abbrev"
              value={formData.doc_type_abbrev}
              onChange={handleChange}
              isInvalid={!!formErrors.doc_type_abbrev}
            >
              {docTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.doc_type_abbrev}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Grupas abreviatūra</Form.Label>
            <Form.Select
              name="doc_group_abbrev"
              value={formData.doc_group_abbrev}
              onChange={handleChange}
              isInvalid={!!formErrors.doc_group_abbrev}
            >
              {docGroupOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
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
              {partners?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partner_name} ({p.partner_reg_nr})
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
        <Button variant="danger" onClick={handleDelete}>
          Dzēst
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Atcelt
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Saglabāt
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
