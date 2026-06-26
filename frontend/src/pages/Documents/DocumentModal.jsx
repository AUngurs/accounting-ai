import React, { useState, useEffect, useRef } from "react";
import { Modal, Form } from "react-bootstrap";
import Select from "react-select";
import { documentRules } from "../../utils/Validators";
import AmountInput from "../../utils/AmountInput";
import { Document, Page, pdfjs } from "react-pdf";
import DocumentLines from "./DocumentLines";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

const docTypeOptions = [
  { value: "Rēķ", label: "Rēķins" },
  { value: "Kredītrēķ.", label: "Kredītrēķins" },
  { value: "Čeks", label: "Čeks" },
  { value: "Grām.", label: "Grāmatojums" },
  { value: "Ienāk.b.dok.", label: "Ienākošais bankas dokuments" },
  { value: "Izej.b.dok.", label: "Izejošais bankas dokuments" },
];

const docGroupOptions = [
  { value: "K", label: "Kredīta parāds" },
  { value: "KA", label: "Kredīta apmaksa" },
  { value: "D", label: "Debeta parāds" },
  { value: "DA", label: "Debeta apmaksa" },
  { value: "-", label: "-" },
];

const docCurrencyOptions = ["EUR", "DKK", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];

// Shared react-select styles
const makeSelectStyles = (isInvalid) => ({
  control: (base, state) => ({
    ...base,
    minHeight: "31px",
    fontSize: "0.875rem",
    borderColor: isInvalid ? "#dc3545" : state.isFocused ? "#4f46e5" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(79,70,229,0.2)" : "none",
    "&:hover": { borderColor: "#4f46e5" },
    borderRadius: "6px",
  }),
  valueContainer: (base) => ({ ...base, padding: "0 8px" }),
  indicatorsContainer: (base) => ({ ...base, height: "31px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, padding: "0 6px" }),
  // menuPortal must be used (not menu) when menuPortalTarget is set
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, fontSize: "0.875rem" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#f1f5f9" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    padding: "6px 12px",
  }),
});

export default function DocumentModal({
  show,
  handleClose,
  documentData,
  pdfFile,
  onSave,
  onDelete,
  partners,
  documents,
  companyId,
  accounts,
  onUpdateAccounted,
}) {
  const isEditMode = !!documentData && !documentData.isNewImport;

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

  const [numPages, setNumPages] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [localPdfFile, setLocalPdfFile] = useState(null);

  const pdfRef = useRef(null);
  const linesRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // Initialize form when modal opens
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

      if (documentData?.pdf_path) {
        setLocalPdfFile(`http://localhost:5001/${documentData.pdf_path}`);
      } else if (pdfFile) {
        setLocalPdfFile(pdfFile);
      } else {
        setLocalPdfFile(null);
      }
    }
  }, [show, documentData, pdfFile]);

  // Reset lines state when modal closes
  useEffect(() => {
    if (!show) {
      linesRef.current?.reset();
    }
  }, [show]);

  // ResizeObserver to track PDF container width
  useEffect(() => {
    if (!pdfRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(pdfRef.current);
    return () => observer.disconnect();
  }, [pdfRef, localPdfFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async () => {
    // Validate document form
    const errors = documentRules(documents, {
      ...formData,
      id: documentData?.id || null,
      doc_type: formData.doc_type_abbrev,
      doc_abbrev: formData.doc_group_abbrev,
      doc_partner: formData.partner_id,
    });

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Validate lines before saving document (so we don't create a doc with broken lines)
    if (linesRef.current) {
      const linesValid = linesRef.current.validateLines();
      if (!linesValid) return;
    }

    // Save document
    const savedDoc = await onSave({ ...documentData, ...formData, file: localPdfFile });
    if (!savedDoc?.id) return; // Save failed (error shown via notify)

    // Save accounting lines
    if (linesRef.current) {
      const linesSaved = await linesRef.current.saveLinesForDoc(savedDoc.id);
      if (!linesSaved) return; // Lines failed, keep modal open
    }

    handleClose();
  };

  const handleDelete = () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo dokumentu?")) return;
    onDelete(documentData.id);
    handleClose();
  };

  // Partner react-select options
  const partnerOptions = [
    { value: "", label: "—" },
    ...(partners
      ?.slice()
      .sort((a, b) => (a.formatted_name || "").localeCompare(b.formatted_name || "", "lv", { sensitivity: "base" }))
      .map((p) => ({
        value: String(p.id),
        label: `${p.formatted_name}${p.partner_reg_nr ? ` (${p.partner_reg_nr})` : ""}`,
      })) ?? []),
  ];
  const selectedPartnerOption = partnerOptions.find((o) => o.value === String(formData.partner_id || "")) || partnerOptions[0];

  const hasPdf = !!localPdfFile;
  const PANEL_MAX_HEIGHT = "calc(85vh - 140px)";

  return (
    <Modal show={show} onHide={handleClose} size="xl" dialogClassName="modal-doc">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Rediģēt dokumentu" : "Pievienot jaunu dokumentu"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          {/* PDF viewer panel — LEFT */}
          {hasPdf && (
            <div
              ref={pdfRef}
              style={{
                flex: "0 0 600px",
                overflowY: "scroll",
                overflowX: "hidden",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "0.5rem",
                boxSizing: "border-box",
                maxHeight: PANEL_MAX_HEIGHT,
              }}
            >
              <Document file={localPdfFile} onLoadSuccess={onDocumentLoadSuccess}>
                {Array.from(new Array(numPages), (el, index) => (
                  <React.Fragment key={index}>
                    <Page pageNumber={index + 1} width={containerWidth - 16} renderAnnotationLayer={false} renderTextLayer={false} />
                    {index < numPages - 1 && <hr style={{ border: "2px dashed #000", margin: "1rem 0" }} />}
                  </React.Fragment>
                ))}
              </Document>
            </div>
          )}

          {/* Document form — CENTER */}
          <div style={{ flex: "0 0 270px", minWidth: 0 }}>
            <Form>
              <Form.Group className="mb-2">
                <Form.Label htmlFor="doc_id">Dokumenta numurs</Form.Label>
                <Form.Control
                  type="text"
                  name="doc_id"
                  id="doc_id"
                  autoComplete="off"
                  value={formData.doc_id}
                  onChange={handleChange}
                  isInvalid={!!formErrors.doc_id}
                />
                <Form.Control.Feedback type="invalid">{formErrors.doc_id}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label htmlFor="doc_date">
                  Datums <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  name="doc_date"
                  id="doc_date"
                  value={formData.doc_date.slice(0, 10)}
                  onChange={handleChange}
                  isInvalid={!!formErrors.doc_date}
                />
                <Form.Control.Feedback type="invalid">{formErrors.doc_date}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label htmlFor="doc_type_abbrev">
                  Dokumenta tips <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Select
                  name="doc_type_abbrev"
                  id="doc_type_abbrev"
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
                <Form.Label htmlFor="doc_group_abbrev">
                  Dokumenta grupa <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Select
                  name="doc_group_abbrev"
                  id="doc_group_abbrev"
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
                <Form.Label htmlFor="doc_currency">
                  Valūta <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <Form.Select
                  name="doc_currency"
                  id="doc_currency"
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

              <Form.Group className="mb-2">
                <Form.Label htmlFor="doc_amount">
                  Summa <span style={{ color: "red" }}>*</span>
                </Form.Label>
                <AmountInput
                  name="doc_amount"
                  id="doc_amount"
                  autoComplete="off"
                  value={formData.doc_amount}
                  onChange={(val) => setFormData({ ...formData, doc_amount: val })}
                  isInvalid={!!formErrors.doc_amount}
                />
                <Form.Control.Feedback type="invalid">{formErrors.doc_amount}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Partneris</Form.Label>
                <Select
                  options={partnerOptions}
                  value={selectedPartnerOption}
                  onChange={(opt) => {
                    setFormData((prev) => ({ ...prev, partner_id: opt?.value || "" }));
                    setFormErrors((prev) => ({ ...prev, partner_id: undefined }));
                  }}
                  styles={makeSelectStyles(!!formErrors.partner_id)}
                  placeholder="Meklēt partneri..."
                  noOptionsMessage={() => "Nav rezultātu"}
                  isClearable={false}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
                {formErrors.partner_id && (
                  <div style={{ color: "#dc3545", fontSize: "0.875em", marginTop: "0.25rem" }}>{formErrors.partner_id}</div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label htmlFor="doc_comments">Piezīmes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="doc_comments"
                  id="doc_comments"
                  autoComplete="off"
                  value={formData.doc_comments}
                  onChange={handleChange}
                  isInvalid={!!formErrors.doc_comments}
                />
                <Form.Control.Feedback type="invalid">{formErrors.doc_comments}</Form.Control.Feedback>
              </Form.Group>
            </Form>
          </div>

          {/* Accounting lines panel — RIGHT */}
          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", maxHeight: PANEL_MAX_HEIGHT }}>
            <DocumentLines
              ref={linesRef}
              companyId={companyId}
              documentId={documentData?.id || null}
              onUpdateAccounted={onUpdateAccounted}
              accounts={accounts || []}
            />
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        {isEditMode && (
          <button type="button" className="btn-app-danger" onClick={handleDelete}>
            Dzēst
          </button>
        )}
        <button type="button" className="btn-app-outline" onClick={handleClose}>
          Atcelt
        </button>
        <button type="button" className="btn-app" onClick={handleSubmit}>
          {isEditMode ? "Saglabāt" : "Pievienot"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
