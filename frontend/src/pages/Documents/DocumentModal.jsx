import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { documentRules } from "../../utils/Validators";
import AmountInput from "../../utils/AmountInput";
import { Document, Page, pdfjs } from "react-pdf";

// Iestata PDF.js worker, lai varētu renderēt PDF failus
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

// Dokumenta tipu izvēles opcijas
const docTypeOptions = [
  { value: "Rēķ", label: "Rēķins" },
  { value: "Kredītrēķ.", label: "Kredītrēķins" },
  { value: "Čeks", label: "Čeks" },
  { value: "Grām.", label: "Grāmatojums" },
  { value: "Ienāk.b.dok.", label: "Ienākošais bankas dokuments" },
  { value: "Izej.b.dok.", label: "Izejošais bankas dokuments" },
];

// Dokumenta grupu izvēles opcijas
const docGroupOptions = [
  { value: "K", label: "Kredīta parāds" },
  { value: "KA", label: "Kredīta apmaksa" },
  { value: "D", label: "Debeta parāds" },
  { value: "DA", label: "Debeta apmaksa" },
  { value: "-", label: "-" },
];

// Valūtu opcijas
const docCurrencyOptions = ["EUR", "DKK", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];

export default function DocumentModal({ show, handleClose, documentData, pdfFile, onSave, onDelete, partners, documents }) {
  // Pārbaude, vai tiek rediģēts esošs dokuments
  const isEditMode = !!documentData && !documentData.isNewImport;

  // Formas dati
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

  // PDF lapu skaits
  const [numPages, setNumPages] = useState(null);
  // Konteinera platums, lai pareizi renderētu PDF lapas
  const [containerWidth, setContainerWidth] = useState(0);
  // Formas validācijas kļūdas
  const [formErrors, setFormErrors] = useState({});

  const pdfContainerRef = useRef(null);
  const [localPdfFile, setLocalPdfFile] = useState(null); // Vietējais PDF fails
  const formRef = useRef(null);
  const pdfRef = useRef(null);

  // Callback funkcija, kad PDF fails ir ielādēts
  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // Inicializē formu katru reizi, kad modal tiek atvērts
  useEffect(() => {
    if (show) {
      const initialData = documentData
        ? {
            doc_id: documentData.doc_id || "",
            doc_date: documentData.doc_date || "",
            doc_type_abbrev: documentData.doc_type_abbrev || docTypeOptions[0].value,
            doc_group_abbrev: documentData.doc_group_abbrev || docGroupOptions[0].value,
            doc_currency: documentData.doc_currency || "EUR",
            doc_amount: documentData.doc_amount || "",
            doc_comments: documentData.doc_comments || "",
            is_accounted: documentData.is_accounted || false,
            partner_id: documentData.partner_id || "",
          }
        : {
            doc_id: "",
            doc_date: "",
            doc_type_abbrev: docTypeOptions[0].value,
            doc_group_abbrev: docGroupOptions[0].value,
            doc_currency: "EUR",
            doc_amount: "",
            doc_comments: "",
            is_accounted: false,
            partner_id: "",
          };

      setFormData(initialData);
      setFormErrors({});

      // PDF faila iestatīšana
      if (documentData?.pdf_path) {
        setLocalPdfFile(`http://localhost:5001/${documentData.pdf_path}`);
      } else if (pdfFile) {
        setLocalPdfFile(pdfFile);
      } else {
        setLocalPdfFile(null);
      }
    }
  }, [show, documentData, pdfFile]);

  // Aprēķina konteineru platumu PDF renderēšanai
  useEffect(() => {
    if (pdfContainerRef.current) {
      const el = pdfContainerRef.current;
      const scrollbarWidth = el.offsetWidth - el.clientWidth; // Ņem vērā scroll joslu platumu
      setContainerWidth(el.offsetWidth - scrollbarWidth);
    }
  }, [show, numPages]);

  // Apstrādā formu izmaiņas
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined })); // Dzēš kļūdas, kad lietotājs labo lauku
  };

  // Formas iesniegšana
  const handleSubmit = () => {
    // Pārbauda validāciju, izmantojot Validators.jsx
    const errors = documentRules(documents, {
      ...formData,
      id: documentData?.id || null,
      doc_type: formData.doc_type_abbrev,
      doc_abbrev: formData.doc_group_abbrev,
      doc_partner: formData.partner_id,
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return; // Nepārsūta datus, ja ir kļūdas
    }

    onSave({ ...documentData, ...formData, file: localPdfFile });
    handleClose();
  };

  // Atcelt formas izmaiņas
  const handleCancel = () => handleClose();

  // Dzēst dokumentu
  const handleDelete = () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo dokumentu?")) return;
    onDelete(documentData.id);
    handleClose();
  };

  // Sinhronizē PDF maksimālo augstumu ar formas augstumu
  useEffect(() => {
    if (formRef.current && pdfRef.current) {
      const formHeight = formRef.current.offsetHeight;
      pdfRef.current.style.maxHeight = formHeight + "px";
    }
  }, [show, formData, partners, numPages]);

  // ResizeObserver, lai dinamiski pielāgotu PDF lapu platumu
  useEffect(() => {
    if (!pdfRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(pdfRef.current);

    return () => observer.disconnect();
  }, [pdfRef, localPdfFile]);

  // Vai ir PDF fails, lai noteiktu modal izmēru
  const hasPdf = !!localPdfFile;

  return (
    <Modal show={show} onHide={handleCancel} size={hasPdf ? "xl" : "md"}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Rediģēt dokumentu" : "Pievienot jaunu dokumentu"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div
          ref={formRef}
          style={{
            display: hasPdf ? "flex" : "block",
            flexDirection: "row",
            gap: hasPdf ? "1rem" : "0",
          }}
        >
          {/* Formas panelis */}
          <div
            style={{
              flex: hasPdf ? 1 : "unset",
              maxWidth: hasPdf ? "100%" : "600px",
              margin: hasPdf ? 0 : "auto",
            }}
          >
            <Form style={{ flex: 1 }}>
              {/* Dokumenta numurs */}
              <Form.Group className="mb-2">
                <Form.Label>Dokumenta numurs</Form.Label>
                <Form.Control
                  type="text"
                  name="doc_id"
                  autoComplete="off"
                  value={formData.doc_id}
                  onChange={handleChange}
                  isInvalid={!!formErrors.doc_id}
                />
                <Form.Control.Feedback type="invalid">{formErrors.doc_id}</Form.Control.Feedback>
              </Form.Group>

              {/* Datums */}
              <Form.Group className="mb-2">
                <Form.Label>
                  Datums <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="doc_date"
                  value={formData.doc_date.slice(0, 10)} // Izgriež tikai YYYY-MM-DD formātu
                  onChange={handleChange}
                  isInvalid={!!formErrors.doc_date}
                />
                <Form.Control.Feedback type="invalid">{formErrors.doc_date}</Form.Control.Feedback>
              </Form.Group>

              {/* Dokumenta tips */}
              <Form.Group className="mb-2">
                <Form.Label>
                  Dokumenta tips <span style={{ color: "red" }}>*</span>
                </Form.Label>
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

              {/* Dokumenta grupa */}
              <Form.Group className="mb-2">
                <Form.Label>
                  Dokumenta grupa <span style={{ color: "red" }}>*</span>
                </Form.Label>
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

              {/* Valūta */}
              <Form.Group className="mb-2">
                <Form.Label>
                  Valūta <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Select
                  name="doc_currency"
                  value={formData.doc_currency}
                  onChange={handleChange}
                  isInvalid={!!formErrors.doc_currency}
                >
                  {docCurrencyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{formErrors.doc_currency}</Form.Control.Feedback>
              </Form.Group>

              {/* Summa */}
              <Form.Group className="mb-2">
                <Form.Label>
                  Summa <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <AmountInput
                  name="doc_amount"
                  autoComplete="off"
                  value={formData.doc_amount}
                  onChange={(val) => setFormData({ ...formData, doc_amount: val })}
                  isInvalid={!!formErrors.doc_amount}
                />
                <Form.Control.Feedback type="invalid">{formErrors.doc_amount}</Form.Control.Feedback>
              </Form.Group>

              {/* Partneris */}
              <Form.Group className="mb-2">
                <Form.Label>Partneris</Form.Label>
                <Form.Select
                  name="partner_id"
                  value={formData.partner_id || ""}
                  onChange={handleChange}
                  isInvalid={!!formErrors.partner_id}
                >
                  <option value=""></option>
                  {/* Meklē partnerus un attēlo alfabēta secībā */}
                  {partners
                    ?.slice()
                    .sort((a, b) => (a.formatted_name || "").localeCompare(b.formatted_name || "", "lv", { sensitivity: "base" }))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {`${p.formatted_name}${p.partner_reg_nr ? ` (${p.partner_reg_nr})` : ""}`}
                      </option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{formErrors.partner_id}</Form.Control.Feedback>
              </Form.Group>

              {/* Piezīmes */}
              <Form.Group className="mb-3">
                <Form.Label>Piezīmes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="doc_comments"
                  autoComplete="off"
                  value={formData.doc_comments}
                  onChange={handleChange}
                  isInvalid={!!formErrors.doc_comments}
                />
                <Form.Control.Feedback type="invalid">{formErrors.doc_comments}</Form.Control.Feedback>
              </Form.Group>
            </Form>
          </div>

          {/* PDF skatītājs, ja fails ir pieejams */}
          {localPdfFile && (
            <div
              ref={pdfRef}
              style={{
                flex: 1,
                overflowY: "scroll",
                overflowX: "hidden",
                border: "1px solid #ccc",
                padding: "0.5rem",
                boxSizing: "border-box",
              }}
            >
              <Document file={localPdfFile} onLoadSuccess={onDocumentLoadSuccess}>
                {Array.from(new Array(numPages), (el, index) => (
                  <React.Fragment key={index}>
                    <Page pageNumber={index + 1} width={containerWidth} renderAnnotationLayer={false} renderTextLayer={false} />
                    {/* Dashed line starp lapām, ja vairākas lapas */}
                    {index < numPages - 1 && <hr style={{ border: "2px dashed #000", margin: "1rem 0" }} />}
                  </React.Fragment>
                ))}
              </Document>
            </div>
          )}
        </div>
      </Modal.Body>

      {/* Footer ar pogām */}
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
