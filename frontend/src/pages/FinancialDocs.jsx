import React, { useEffect, useState, useRef, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import DocumentLines from "../components/DocumentLines";
import EditDocumentModal from "../components/EditDocumentModal";
import { notify } from "../utils/notify";
import { Table } from "react-bootstrap";

const ROW_HEIGHT = 24; // approximate height of each row (adjust if needed)
const VISIBLE_ROWS = 25; // number of rows to render in the viewport

export default function FinancialDocs() {
  const [docsData, setDocsData] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: "doc_date", direction: "desc" });
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const { companyId } = useCompany();
  const [openDocId, setOpenDocId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const docTypeOptions = ["Čeks", "Grām.", "Ienāk.b.dok.", "Izej.b.dok.", "Kredītrēķ.", "Rēķ"];
  const docCurrencyOptions = ["DKK", "EUR", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    docId: "",
    partnerId: "",
    docType: "",
    currency: "",
    amountMin: "",
    amountMax: "",
    comments: "",
  });

  // Fetch partners
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyId}/partners`)
      .then((res) => setPartnersData(res.data))
      .catch((err) => console.error(err));
  }, [companyId]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/companies/${companyId}/documents`);
      setDocsData(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Map partners for display
  const partnerMap = {};
  partnersData.forEach((p) => {
    if (!p) return;
    partnerMap[p.id] = `${p.partner_name ?? ""}${p.partner_title ? ", " + p.partner_title : ""}`;
  });

  // Filter documents
  const filteredDocs = docsData.filter((doc) => {
    const docDate = new Date(doc.doc_date);
    return (
      (!filters.dateFrom || docDate >= new Date(filters.dateFrom)) &&
      (!filters.dateTo || docDate <= new Date(filters.dateTo)) &&
      (!filters.docId || doc.doc_id.toString().includes(filters.docId)) &&
      (!filters.partnerId || doc.partner_id === Number(filters.partnerId)) &&
      (!filters.docType || doc.doc_type_abbrev === filters.docType) &&
      (!filters.currency || doc.doc_currency === filters.currency) &&
      (!filters.amountMin || Number(doc.doc_amount) >= Number(filters.amountMin)) &&
      (!filters.amountMax || Number(doc.doc_amount) <= Number(filters.amountMax)) &&
      (!filters.comments || doc.doc_comments?.toLowerCase().includes(filters.comments.toLowerCase()))
    );
  });

  // Sort documents
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === "partner_id") {
      aValue = partnerMap[aValue] || "";
      bValue = partnerMap[bValue] || "";
    } else if (sortConfig.key === "doc_date") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortConfig.key === "doc_amount") {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (typeof aValue === "string") {
      const comparison = aValue.localeCompare(bValue, "lv", { sensitivity: "base" });
      return sortConfig.direction === "asc" ? comparison : -comparison;
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleImport = async () => {
    if (!file) return alert("Izvēlieties XML datni (failu)!");
    const formData = new FormData();
    formData.append("xmlFile", file);
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocsData((prev) => [...prev, ...res.data.newDocuments]);
      fileInputRef.current.value = "";
      setFile(null);
      notify.success(`Veiksmīgi importēti ${res.data.newDocuments.length} finanšu dokumenti!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Import failed!");
    }
  };

  const handleExport = async () => {
    // Export logic (keep your original implementation)
  };

  const handleEditClick = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
  };

  const handleSave = async (updatedDocument) => {
    try {
      const res = await axiosInstance.put(`/companies/${companyId}/documents/${updatedDocument.id}`, updatedDocument);
      setDocsData((prev) => prev.map((d) => (d.id === updatedDocument.id ? res.data : d)));
      setShowModal(false);
      setSelectedDocument(null);
      notify.success("Finanšu dokuments veiksmīgi rediģēts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda saglabājot dokumentu");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/companies/${companyId}/documents/${id}`);
      setDocsData((prev) => prev.filter((doc) => doc.id !== id));
      notify.success("Finanšu dokuments veiksmīgi dzēsts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst atlasītos finanšu dokumentus?")) return;
    try {
      const ids = Array.from(selectedDocs);
      await axiosInstance.post(`/companies/${companyId}/documents/bulk-delete`, { ids });
      setDocsData((prev) => prev.filter((doc) => !selectedDocs.has(doc.id)));
      notify.success(`Veiksmīgi dzēsti ${ids.length} finanšu dokumenti!`);
      setSelectedDocs(new Set());
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  // Virtualization logic
  const totalRows = sortedDocs.length * 2; // include collapse row
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT));
  const endIndex = Math.min(totalRows, startIndex + VISIBLE_ROWS * 2); // 2 rows per doc (main + collapse)
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = (totalRows - endIndex) * ROW_HEIGHT;

  const visibleRows = [];
  for (let i = startIndex; i < endIndex; i += 2) {
    const doc = sortedDocs[Math.floor(i / 2)];
    visibleRows.push(
      <React.Fragment key={doc.id}>
        <tr onClick={() => setOpenDocId(openDocId === doc.id ? null : doc.id)} style={{ cursor: "pointer" }}>
          <td style={{ textAlign: "center" }}>
            <input
              type="checkbox"
              className="form-check-input"
              checked={selectedDocs.has(doc.id)}
              onChange={(e) => {
                const newSet = new Set(selectedDocs);
                e.target.checked ? newSet.add(doc.id) : newSet.delete(doc.id);
                setSelectedDocs(newSet);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </td>
          <td>{doc.doc_date}</td>
          <td>{doc.doc_id}</td>
          <td>{partnerMap[doc.partner_id] || ""}</td>
          <td>{doc.doc_type_abbrev}</td>
          <td>{doc.doc_currency}</td>
          <td style={{ backgroundColor: doc.is_accounted ? "#d4edda" : "#f8d7da" }}>{doc.doc_amount}</td>
          <td>{doc.doc_comments}</td>
          <td>
            <div className="d-flex justify-content-evenly">
              <button
                className="btn p-0 border-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(doc);
                }}
              >
                <i className="bi bi-pencil-square"></i>
              </button>
            </div>
          </td>
        </tr>
        {openDocId === doc.id && (
          <tr>
            <td colSpan={9} style={{ padding: 0, border: 0 }}>
              <DocumentLines companyId={companyId} documentId={doc.id} onUpdateAccounted={fetchDocuments} />
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }

  return (
    <div>
      <h2 className="mb-3">Finanšu dokumenti</h2>

      <div className="mb-3 d-flex gap-2">
        <button className="btn custom-dark-hover" onClick={handleImport}>
          Importēt XML
        </button>
        <input type="file" accept=".xml" ref={fileInputRef} onChange={handleFileChange} className="form-control w-auto" />

        {selectedDocs.size > 0 && (
          <React.Fragment>
            <button className="btn custom-dark-hover" onClick={handleExport}>
              Eksportēt XML
            </button>
            <button className="btn custom-red-hover" onClick={handleDeleteSelected}>
              Dzēst {selectedDocs.size} dokumentus
            </button>
          </React.Fragment>
        )}
      </div>

      <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
        <colgroup>
          <col style={{ width: "3%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "10%" }} />
          <col style={{ width: "21%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "5%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "36%" }} />
          <col style={{ width: "38px" }} />
        </colgroup>
        <thead>
          <tr className="align-middle">
            <th style={{ textAlign: "center", borderBottom: "none" }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={selectedDocs.size === filteredDocs.length && filteredDocs.length > 0}
                onChange={(e) => setSelectedDocs(e.target.checked ? new Set(filteredDocs.map((d) => d.id)) : new Set())}
              />
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_date")}>
              Datums {sortConfig.key === "doc_date" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_id")}>
              Nr. {sortConfig.key === "doc_id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("partner_id")}>
              Partneris {sortConfig.key === "partner_id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_type_abbrev")}>
              Dok. tips {sortConfig.key === "doc_type_abbrev" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_currency")}>
              Valūta {sortConfig.key === "doc_currency" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_amount")}>
              Summa {sortConfig.key === "doc_amount" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_comments")}>
              Piezīmes {sortConfig.key === "doc_comments" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ borderBottom: "none" }}></th>
          </tr>
          <tr>
            <th style={{ borderBottom: "none" }}></th>
            <th style={{ borderBottom: "none" }}>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </th>
            <th style={{ borderBottom: "none" }}></th>
            <th style={{ borderBottom: "none" }}></th>
            <th style={{ borderBottom: "none" }}></th>
            <th style={{ borderBottom: "none" }}></th>
            <th style={{ borderBottom: "none" }}>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="No"
                value={filters.amountMin}
                onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
              />
            </th>
            <th style={{ borderBottom: "none" }}></th>
            <th style={{ borderBottom: "none" }}></th>
          </tr>
          <tr>
            <th></th>
            <th>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </th>
            <th>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Dokumenta nr."
                value={filters.docId}
                onChange={(e) => setFilters({ ...filters, docId: e.target.value })}
              />
            </th>
            <th>
              <select
                className="form-select form-select-sm"
                value={filters.partnerId}
                onChange={(e) => setFilters({ ...filters, partnerId: e.target.value })}
              >
                <option value="">Visi</option>
                {partnersData.map((p) => (
                  <option key={p.id} value={p.id}>
                    {partnerMap[p.id] || ""}
                  </option>
                ))}
              </select>
            </th>
            <th>
              <select
                className="form-select form-select-sm"
                value={filters.docType}
                onChange={(e) => setFilters({ ...filters, docType: e.target.value })}
              >
                <option value="">Visi</option>
                {docTypeOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </th>
            <th>
              <select
                className="form-select form-select-sm"
                value={filters.currency}
                onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
              >
                <option value="">Visi</option>
                {docCurrencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </th>
            <th>
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Līdz"
                value={filters.amountMax}
                onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
              />
            </th>
            <th>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Meklēt..."
                value={filters.comments}
                onChange={(e) => setFilters({ ...filters, comments: e.target.value })}
              />
            </th>
            <th className="text-center align-middle">
              <button
                type="button"
                className="btn btn-sm custom-red-hover  "
                style={{ padding: "0.15rem 0.25rem", fontSize: "0.85rem", lineHeight: 1 }}
                onClick={() =>
                  setFilters({
                    dateFrom: "",
                    dateTo: "",
                    docId: "",
                    partnerId: "",
                    docType: "",
                    currency: "",
                    amountMin: "",
                    amountMax: "",
                    comments: "",
                  })
                }
              >
                <i className="bi bi-x-square"></i>
              </button>
            </th>
          </tr>
        </thead>
      </Table>

      <div
        style={{ height: ROW_HEIGHT * VISIBLE_ROWS, overflowY: "auto", borderBottom: "6px solid #19221c" }}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
        ref={containerRef}
      >
        <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "21%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "36%" }} />
            <col style={{ width: "38px" }} />
          </colgroup>
          <tbody>
            <tr style={{ height: paddingTop }} />
            {visibleRows}
            <tr style={{ height: paddingBottom }} />
          </tbody>
        </Table>
      </div>

      <EditDocumentModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        documentData={selectedDocument}
        onSave={handleSave}
        onDelete={handleDelete}
        partners={partnersData}
      />
    </div>
  );
}
