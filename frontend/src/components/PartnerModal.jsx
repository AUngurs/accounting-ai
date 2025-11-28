import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { partnerRules } from "../utils/validators";

export default function PartnerModal({ show, handleClose, partner, onSave, onDelete, partners }) {
  const isEditMode = !!partner;

  const [formData, setFormData] = useState({
    kind_name: "",
    title: "",
    name: "",
    reg_nr: "",
    vat_type: "",
    vat_country_code: "",
  });

  const [vatNrInput, setVatNrInput] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const kindNameOptions = ["Juridiska persona", "Fiziska persona", "Darbinieks"];
  const vatTypeOptions = ["Apliekama persona, LV", "Apliekama persona, EU"];
  const vatCountryOptions = [
    "AT",
    "AU",
    "BE",
    "BG",
    "BY",
    "CA",
    "CH",
    "CN",
    "CZ",
    "DE",
    "DK",
    "EE",
    "ES",
    "FI",
    "FR",
    "GB",
    "GR",
    "HU",
    "IE",
    "IL",
    "IN",
    "IT",
    "JP",
    "LT",
    "LU",
    "LV",
    "MY",
    "NL",
    "NO",
    "PL",
    "RU",
    "SE",
    "SI",
    "SK",
    "UA",
    "US",
  ];

  // Initialize form
  useEffect(() => {
    if (isEditMode) {
      const countryCode = partner.vat_country_code || "";
      const vatFull = partner.vat_nr || "";
      const vatNum = vatFull.startsWith(countryCode) ? vatFull.slice(countryCode.length) : vatFull;

      setFormData({
        kind_name: partner.partner_kind_name,
        title: partner.partner_title,
        name: partner.partner_name,
        reg_nr: partner.partner_reg_nr,
        vat_type: partner.partner_vat_type,
        vat_country_code: countryCode,
      });
      setVatNrInput(vatNum);
    } else {
      // Reset for create mode
      setFormData({
        kind_name: "Fiziska persona",
        title: "",
        name: "",
        reg_nr: "",
        vat_type: "",
        vat_country_code: "",
      });
      setVatNrInput("");
    }
    setFormErrors({});
  }, [isEditMode, partner, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleVatNrChange = (e) => {
    setVatNrInput(e.target.value);
    setFormErrors((prev) => ({ ...prev, vat_nr: undefined }));
  };

  const handleSubmit = () => {
    const combinedVatNr = formData.vat_country_code + vatNrInput;
    const dataToValidate = { ...partner, ...formData, vat_nr: combinedVatNr };
    const errors = partnerRules(partners, dataToValidate);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSave({ ...partner, ...formData, vat_nr: combinedVatNr });
    handleClose();
  };

  const handleDelete = () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo partneri?")) return;
    onDelete(partner.id);
    handleClose();
  };

  const isCompany = formData.kind_name === "Juridiska persona";

  const labels = {
    title: isCompany ? "Tiesiskā forma" : "Uzvārds",
    name: isCompany ? "Nosaukums" : "Vārds",
    reg_nr: isCompany ? "Reģistrācijas nr." : "Personas kods",
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Rediģēt partneri" : "Pievienot jaunu partneri"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-2">
            <Form.Label>Juridiska persona/Fiziska persona/Darbinieks</Form.Label>
            <Form.Select name="kind_name" value={formData.kind_name} onChange={handleChange} isInvalid={!!formErrors.kind_name}>
              {kindNameOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.kind_name}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>{labels.title}</Form.Label>
            <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} isInvalid={!!formErrors.title} />
            <Form.Control.Feedback type="invalid">{formErrors.title}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>{labels.name}</Form.Label>
            <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!formErrors.name} />
            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>{labels.reg_nr}</Form.Label>
            <Form.Control type="text" name="reg_nr" value={formData.reg_nr} onChange={handleChange} isInvalid={!!formErrors.reg_nr} />
            <Form.Control.Feedback type="invalid">{formErrors.reg_nr}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Nodokļu maksātāja statuss</Form.Label>
            <Form.Select name="vat_type" value={formData.vat_type} onChange={handleChange} isInvalid={!!formErrors.vat_type}>
              {vatTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.vat_type}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>PVN valsts</Form.Label>
            <Form.Select
              name="vat_country_code"
              value={formData.vat_country_code}
              onChange={handleChange}
              isInvalid={!!formErrors.vat_country_code || !!formErrors.vat_nr}
            >
              {vatCountryOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.vat_country_code}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>PVN numurs</Form.Label>
            <Form.Control
              type="text"
              name="vat_nr_input"
              value={vatNrInput}
              onChange={handleVatNrChange}
              isInvalid={!!formErrors.vat_nr}
              placeholder="Numurs bez valsts koda"
            />
            <Form.Control.Feedback type="invalid">{formErrors.vat_nr}</Form.Control.Feedback>
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
        <Button className="custom-dark-hover" onClick={handleSubmit}>
          {isEditMode ? "Saglabāt" : "Pievienot"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
