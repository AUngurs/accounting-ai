import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { companyRules } from "../utils/Validators";

export default function EditCompanyModal({ show, handleClose, company, onSave, onDelete, companies }) {
  // Nosaka, vai modal ir rediģēšanas režīmā vai pievienošanas režīmā
  const isEditMode = !!company;

  // Stāvoklis formā ievadītajam uzņēmuma nosaukumam
  const [formData, setFormData] = useState({
    name: "",
  });

  // Stāvoklis validācijas kļūdām
  const [formErrors, setFormErrors] = useState({});

  // useEffect sinhronizē formu ar nodoto uzņēmumu un notīra kļūdas katru reizi, kad modal tiek atvērts
  useEffect(() => {
    if (company) {
      setFormData({ name: company.name });
    } else {
      setFormData({ name: "" });
    }
    setFormErrors({});
  }, [company, show]);

  // Apstrādā formu lauku izmaiņas un noņem attiecīgās kļūdas
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Apstrādā formu saglabāšanu
  const handleSubmit = () => {
    // Validē datus, izmantojot companyRules
    const errors = companyRules(companies, formData);

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors); // Atjauno kļūdas stāvokli, ja validācija neizdevās
      return;
    }

    // Saglabā uzņēmuma datus, nogriež liekās atstarpes
    onSave({ ...company, ...formData, name: formData.name.trim() });
    handleClose(); // Aizver modal pēc saglabāšanas
  };

  // Apstrādā uzņēmuma dzēšanu ar apstiprinājuma logu
  const handleDelete = () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo uzņēmumu?")) return;
    onDelete(company.id); // Izsauc dzēšanas callback
    handleClose(); // Aizver modal pēc dzēšanas
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
            e.preventDefault(); // Novērš noklusējuma formu iesniegšanu
            handleSubmit(); // Izsauc saglabāšanas funkciju
          }}
        >
          {/* Uzņēmuma nosaukuma lauks ar validācijas atgriezenisko saiti */}
          <Form.Group className="mb-2">
            <Form.Label>Uzņēmuma nosaukums</Form.Label>
            <Form.Control
              type="text"
              name="name"
              autoComplete="off"
              value={formData.name}
              onChange={handleChange}
              isInvalid={!!formErrors.name}
              placeholder="Ievadiet uzņēmuma nosaukumu"
            />
            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
          </Form.Group>
        </Form>
      </Modal.Body>

      {/* Modal kājenes pogas ar dzēšanas, atcelšanas un saglabāšanas/pievienošanas funkcionalitāti */}
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
