import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { accountRules } from "../utils/Validators";

export default function AccountModal({ show, handleClose, account, onSave, onDelete, accounts }) {
  // Sākotnējie formData stāvokļa dati, kas tiek izmantoti formā
  const [formData, setFormData] = useState({ code: "", name: "", type: "", category: "" });

  // Objekts formErrors satur validācijas kļūdas katram laukam
  const [formErrors, setFormErrors] = useState({});

  // Opciju saraksti select laukiem
  const typeOptions = ["Analītiskais", "Sintētiskais"];
  const categoryOptions = ["Aktīva", "Pasīva", "Operāciju"];

  // useEffect sinhronizē formData ar nodoto account objektu katru reizi, kad tas mainās vai modal tiek atvērts
  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
      });
    }
    setFormErrors({});
  }, [account, show]);

  // Apstrādā formu lauku izmaiņas un noņem attiecīgās kļūdas, ja tās pastāv
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Apstrādā formu saglabāšanu
  const handleSubmit = () => {
    // Validē datus, izmantojot accountRules
    const errors = accountRules(accounts, { ...account, ...formData });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors); // Atjauno kļūdu stāvokli, ja validācija neizdevās
      return;
    }

    // Saglabā konta datus, nogriež liekās atstarpes
    onSave({
      ...account,
      ...formData,
      code: formData.code.trim(),
      name: formData.name.trim(),
    });
    handleClose(); // Aizver modal logu pēc saglabāšanas
  };

  // Apstrādā konta dzēšanu ar apstiprinājuma logu
  const handleDelete = async () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo kontu?")) return;
    onDelete(account.id); // Izsauc dzēšanas callback
    handleClose(); // Aizver modal logu pēc dzēšanas
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
            e.preventDefault(); // Novērš noklusējuma formu iesniegšanu
            handleSubmit(); // Izsauc saglabāšanas funkciju
          }}
        >
          {/* Koda lauks ar validācijas atgriezenisko saiti */}
          <Form.Group className="mb-2">
            <Form.Label htmlFor="code">
              Kods <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="code"
              id="code"
              autoComplete="off"
              value={formData.code}
              onChange={handleChange}
              isInvalid={!!formErrors.code}
            />
            <Form.Control.Feedback type="invalid">{formErrors.code}</Form.Control.Feedback>
          </Form.Group>

          {/* Nosaukuma lauks ar validācijas atgriezenisko saiti */}
          <Form.Group className="mb-2">
            <Form.Label htmlFor="name">
              Nosaukums <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Control
              type="text"
              name="name"
              id="name"
              autoComplete="off"
              value={formData.name}
              onChange={handleChange}
              isInvalid={!!formErrors.name}
            />
            <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
          </Form.Group>

          {/* Analītiskais/Sintētiskais select lauks */}
          <Form.Group className="mb-2">
            <Form.Label htmlFor="type">
              Analītiskais/Sintētiskais <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Select name="type" id="type" value={formData.type} onChange={handleChange} isInvalid={!!formErrors.type}>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{formErrors.type}</Form.Control.Feedback>
          </Form.Group>

          {/* Aktīva/Pasīva/Operāciju select lauks */}
          <Form.Group className="mb-2">
            <Form.Label htmlFor="category">
              Aktīva/Pasīva/Operāciju <span style={{ color: "red" }}>*</span>
            </Form.Label>
            <Form.Select name="category" id="category" value={formData.category} onChange={handleChange} isInvalid={!!formErrors.category}>
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

      {/* Modal kājenes pogas ar dzēšanas, atcelšanas un saglabāšanas funkcionalitāti */}
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
