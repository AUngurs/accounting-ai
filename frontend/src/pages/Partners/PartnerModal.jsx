import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { partnerRules } from "../../utils/Validators";

export default function PartnerModal({ show, handleClose, partner, onSave, onDelete, partners }) {
  const isEditMode = !!partner; // Pārbauda, vai modal ir rediģēšanas režīmā

  const [formData, setFormData] = useState({
    kind_name: "Juridiska persona",
    title: "",
    name: "",
    reg_nr: "",
    vat_type: "",
    vat_country_code: "LV",
  });

  const [vatNrInput, setVatNrInput] = useState("");
  // Objekts formErrors satur validācijas kļūdas katram laukam
  const [formErrors, setFormErrors] = useState({});
  const [isVatEditable, setIsVatEditable] = useState(false);

  const kindNameOptions = ["Juridiska persona", "Fiziska persona", "Darbinieks"];
  const vatTypeOptions = ["Apliekama persona, LV", "Apliekama persona, EU"];
  // prettier-ignore
  const vatCountryOptions = ["LV", "AT", "AU", "BE", "BG", "BY", "CA", "CH", "CN", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB", "GR", "HU", "IE", "IL", "IN", "IT", "JP", "LT", "LU", "MY", "NL", "NO", "PL", "RU", "SE", "SI", "SK", "UA", "US", ];

  const isVatCountryDisabled = formData.vat_type === "Apliekama persona, LV";
  const vatCountryValue = isVatCountryDisabled ? "LV" : formData.vat_country_code;

  // Sākuma dati, atkarībā no režīma (rediģēšana/pievienošana)
  useEffect(() => {
    if (isEditMode && partner) {
      const countryCode = partner.vat_country_code || "";
      const vatFull = partner.vat_nr || "";
      const vatNum = vatFull.startsWith(countryCode) ? vatFull.slice(countryCode.length) : vatFull;

      setFormData({
        kind_name: partner.partner_kind_name,
        title: partner.partner_title || "",
        name: partner.partner_name || "",
        reg_nr: partner.partner_reg_nr || "",
        vat_type: partner.partner_vat_type || "",
        vat_country_code: countryCode || "LV",
      });
      setVatNrInput(vatNum);
      setIsVatEditable(!!partner.partner_vat_type && !!vatFull);
    } else {
      setFormData({
        kind_name: "Juridiska persona",
        title: "",
        name: "",
        reg_nr: "",
        vat_type: "Apliekama persona, LV",
        vat_country_code: "LV",
      });
      setVatNrInput("");
      setIsVatEditable(false);
    }
    setFormErrors({});
  }, [isEditMode, partner, show]);

  // Funkcija PVN lauku ieslēgšanai/izslēgšanai
  const toggleVatEdit = (checked) => {
    setIsVatEditable(checked);
    if (!checked) {
      setFormData((prev) => ({
        ...prev,
        vat_type: "",
        vat_country_code: "LV",
      }));
      setVatNrInput("");
      setFormErrors((prev) => ({
        ...prev,
        vat_type: undefined,
        vat_country_code: undefined,
        vat_nr: undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vat_type: "Apliekama persona, LV",
        vat_country_code: "LV",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "vat_type" && value === "Apliekama persona, LV") {
        return { ...prev, [name]: value, vat_country_code: "LV" };
      }
      return { ...prev, [name]: value };
    });
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleVatNrChange = (e) => {
    setVatNrInput(e.target.value);
    setFormErrors((prev) => ({ ...prev, vat_nr: undefined }));
  };

  // Apstrādā formu saglabāšanu
  const handleSubmit = () => {
    const combinedVatNr = isVatEditable ? formData.vat_country_code + vatNrInput.trim() : "";

    const dataToValidate = {
      ...partner,
      ...formData,
      vat_nr: combinedVatNr,
      isVatEditable,
    };
    // Validē datus, izmantojot partnerRules
    const errors = partnerRules(partners, dataToValidate);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors); // Atjauno kļūdu stāvokli, ja validācija neizdevās
      return;
    }

    onSave({
      ...partner,
      ...formData,
      vat_nr: combinedVatNr,
      partner_name: formData.name.trim(),
      partner_title: formData.title.trim(),
      partner_reg_nr: formData.reg_nr.trim(),
    });

    handleClose();
  };

  // Dzēšanas funkcija ar apstiprinājumu
  const handleDelete = () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo partneri?")) return;
    onDelete(partner.id);
    handleClose();
  };

  // Placeholderi atkarībā no juridiskā/fiziskā partnera
  const isCompany = formData.kind_name === "Juridiska persona";
  const labels = {
    title: isCompany ? "Tiesiskā forma" : "Uzvārds",
    name: isCompany ? "Nosaukums" : "Vārds",
    reg_nr: isCompany ? "Reģistrācijas numurs" : "Personas kods",
    placeholder: isCompany ? "SIA, AS, ZS u.c." : "",
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Rediģēt partneri" : "Pievienot jaunu partneri"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Partnera veids */}
          <Form.Group className="mb-2">
            <Form.Label>
              Juridiska persona/Fiziska persona/Darbinieks <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Select name="kind_name" value={formData.kind_name} onChange={handleChange} isInvalid={!!formErrors.kind_name}>
              {kindNameOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.kind_name}</Form.Control.Feedback>
          </Form.Group>

          {/* Tiesiskā forma/Uzvārds */}
          <Form.Group className="mb-2">
            <Form.Label>
              {labels.title} {!isCompany && <span style={{ color: "red" }}>*</span>}
            </Form.Label>
            <Form.Control
              type="text"
              name="title"
              autoComplete="off"
              value={formData.title}
              onChange={handleChange}
              isInvalid={!!formErrors.title}
              placeholder={labels.placeholder}
            />
            <Form.Control.Feedback type="invalid">{formErrors.title}</Form.Control.Feedback>
          </Form.Group>

          {/* Nosaukums/Vārds */}
          <Form.Group className="mb-2">
            <Form.Label>
              {labels.name} <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              autoComplete="off"
              value={formData.name}
              onChange={handleChange}
              isInvalid={!!formErrors.name}
            />
            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
          </Form.Group>

          {/* Reģistrācijas numurs/Personas kods */}
          <Form.Group className="mb-2">
            <Form.Label>{labels.reg_nr}</Form.Label>
            <Form.Control
              type="text"
              name="reg_nr"
              autoComplete="off"
              value={formData.reg_nr}
              onChange={handleChange}
              isInvalid={!!formErrors.reg_nr}
            />
            <Form.Control.Feedback type="invalid">{formErrors.reg_nr}</Form.Control.Feedback>
          </Form.Group>

          {/* PVN checkbox un lauki */}
          <Form.Check
            type="checkbox"
            id="enableVatEdit"
            label="Nodokļu maksātājs"
            className="mt-4 mb-2"
            checked={isVatEditable}
            onChange={(e) => toggleVatEdit(e.target.checked)}
          />

          <Form.Group className="mb-2">
            <Form.Label>Nodokļu maksātāja statuss {isVatEditable && <span style={{ color: "red" }}>*</span>}</Form.Label>
            <Form.Select
              name="vat_type"
              value={formData.vat_type}
              onChange={handleChange}
              isInvalid={!!formErrors.vat_type}
              disabled={!isVatEditable}
            >
              {vatTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.vat_type}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>PVN valsts {isVatEditable && <span style={{ color: "red" }}>*</span>}</Form.Label>
            <Form.Select
              name="vat_country_code"
              value={vatCountryValue}
              onChange={handleChange}
              disabled={!isVatEditable || isVatCountryDisabled}
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
            <Form.Label>PVN numurs {isVatEditable && <span style={{ color: "red" }}>*</span>}</Form.Label>
            <Form.Control
              type="text"
              name="vat_nr_input"
              value={vatNrInput}
              autoComplete="off"
              onChange={handleVatNrChange}
              isInvalid={!!formErrors.vat_nr}
              placeholder="Numurs bez valsts koda"
              disabled={!isVatEditable}
            />
            <Form.Control.Feedback type="invalid">{formErrors.vat_nr}</Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>

      {/* Modal pogas: dzēst, atcelt, saglabāt/pievienot */}
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
