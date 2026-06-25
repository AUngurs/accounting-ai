import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
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

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

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

  // ResizeObserver to dynamically adjust PDF page width
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = () => {
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
    onSave({ ...documentData, ...formData, file: localPdfFile });
    handleClose();
  };

  const handleDelete = () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst šo dokumentu?")) return;
    onDelete(documentData.id);
    handleClose();
  };

  const hasPdf = !!localPdfFile;
  const showLines = isEditMode && !!documentData?.id;

  // Size: xl when PDF present (3 or 2 panels with PDF), lg when lines only, md for new doc without PDF
  const modalSize = hasPdf ? "xl" : showLines ? "lg" : "md";

  const PANEL_MAX_HEIGHT = "calc(85vh - 140px)";

  return (
    <Modal show={show} onHide={handleClose} size={modalSize}>
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? "Rediģēt dokumentu" : "Pievienot jaunu dokumentu"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>

          {/* Document form panel – fixed width */}
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
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                    <option key={opt} value={opt}>{opt}</option>
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
                <Form.Label htmlFor="partner_id">Partneris</Form.Label>
                <Form.Select
                  name="partner_id"
                  id="partner_id"
                  value={formData.partner_id || ""}
                  onChange={handleChange}
                  isInvalid={!!formErrors.partner_id}
                >
                  <option value=""></option>
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

          {/* Accounting lines panel – only for existing documents */}
          {showLines && (
            <div style={{ flex: 1, minWidth: 0, overflowY: "auto", maxHeight: PANEL_MAX_HEIGHT }}>
              <DocumentLines
                companyId={companyId}
                documentId={documentData.id}
                onUpdateAccounted={onUpdateAccounted}
                accounts={accounts}
              />
            </div>
          )}

          {/* PDF viewer panel */}
          {hasPdf && (
            <div
              ref={pdfRef}
              style={{
                flex: 1,
                minWidth: 0,
                overflowY: "scroll",
                overflowX: "hidden",
                border: "1px solid var(--border)",
                padding: "0.5rem",
                boxSizing: "border-box",
                maxHeight: PANEL_MAX_HEIGHT,
              }}
            >
              <Document file={localPdfFile} onLoadSuccess={onDocumentLoadSuccess}>
                {Array.from(new Array(numPages), (el, index) => (
                  <React.Fragment key={index}>
                    <Page pageNumber={index + 1} width={containerWidth} renderAnnotationLayer={false} renderTextLayer={false} />
                    {index < numPages - 1 && <hr style={{ border: "2px dashed #000", margin: "1rem 0" }} />}
                  </React.Fragment>
                ))}
              </Document>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        {isEditMode && (
          <Button className="btn-app-danger" onClick={handleDelete}>
            Dzēst
          </Button>
        )}
        <Button className="btn-app-outline" onClick={handleClose}>
          Atcelt
        </Button>
        <Button className="btn-app" onClick={handleSubmit}>
          {isEditMode ? "Saglabāt" : "Pievienot"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
