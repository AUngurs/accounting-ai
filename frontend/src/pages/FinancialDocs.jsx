import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import DocumentLines from "../components/DocumentLines";
import EditDocumentModal from "../components/EditDocumentModal";
import { notify } from "../utils/notify";

export default function FinancialDocs() {
  const [docsData, setDocsData] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: "doc_date", direction: "desc" });
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const { companyId } = useCompany();
  const [openDocId, setOpenDocId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(new Set());
  const [showModal, setShowModal] = useState(false);

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
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyId}/documents`)
      .then((res) => setDocsData(res.data))
      .catch((err) => console.error(err));
  }, [companyId]);

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
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
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

  // Import documents from XML
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

  // Export documents to XML
  const handleExport = async () => {};

  const handleEditClick = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
  };

  // Edit document
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

  // Delete individual document
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

  // Delete multiple selected documents
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

  return (
    <div>
      <h2 className="mb-3">Finanšu dokumenti</h2>

      <div className="mb-3 d-flex gap-2">
        <button className="btn btn-success" onClick={handleImport}>
          Importēt XML
        </button>
        <input type="file" accept=".xml" ref={fileInputRef} onChange={handleFileChange} className="form-control w-auto" />
        <button className="btn btn-primary" onClick={handleExport}>
          Eksportēt XML
        </button>
        {selectedDocs.size > 0 && (
          <button className="btn btn-danger" onClick={handleDeleteSelected}>
            Dzēst {selectedDocs.size} dokumentus
          </button>
        )}
      </div>

      <div className="table-responsive rounded-1">
        <table className="table table-striped table-bordered table-sm table-hover">
          <colgroup>
            <col style={{ width: "2%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "4%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "37%" }} />
            <col style={{ width: "38px" }} />
          </colgroup>
          <thead className="table-dark">
            <tr className="align-middle">
              <th style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  checked={selectedDocs.size === docsData.length && docsData.length > 0}
                  onChange={(e) => setSelectedDocs(e.target.checked ? new Set(docsData.map((d) => d.id)) : new Set())}
                />
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("doc_date")}>
                Datums {sortConfig.key === "doc_date" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("doc_id")}>
                Nr. {sortConfig.key === "doc_id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("partner_id")}>
                Partneris {sortConfig.key === "partner_id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("doc_type_abbrev")}>
                Dok. tips {sortConfig.key === "doc_type_abbrev" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("doc_currency")}>
                Valūta {sortConfig.key === "doc_currency" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th style={{ cursor: "pointer" }} onClick={() => handleSort("doc_amount")}>
                Summa {sortConfig.key === "doc_amount" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
              </th>
              <th>Piezīmes</th>
              <th></th>
            </tr>
            <tr className="bg-light">
              <td></td>
              <td>
                <input
                  type="date"
                  className="form-control mb-1"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
                <input
                  type="date"
                  className="form-control"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ID"
                  value={filters.docId}
                  onChange={(e) => setFilters({ ...filters, docId: e.target.value })}
                />
              </td>
              <td>
                <select
                  className="form-select"
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
              </td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tips"
                  value={filters.docType}
                  onChange={(e) => setFilters({ ...filters, docType: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Valūta"
                  value={filters.currency}
                  onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  className="form-control mb-1"
                  placeholder="Min"
                  value={filters.amountMin}
                  onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Max"
                  value={filters.amountMax}
                  onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Meklēt..."
                  value={filters.comments}
                  onChange={(e) => setFilters({ ...filters, comments: e.target.value })}
                />
              </td>
              <td></td>
            </tr>
          </thead>

          <tbody>
            {sortedDocs.map((doc) => (
              <React.Fragment key={doc.id}>
                <tr onClick={() => setOpenDocId(openDocId === doc.id ? null : doc.id)} style={{ cursor: "pointer" }}>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
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
                  <td>{doc.doc_amount}</td>
                  <td>{doc.doc_comments}</td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(doc);
                      }}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </td>
                </tr>

                {openDocId === doc.id && (
                  <tr>
                    <td colSpan={9}>
                      <DocumentLines companyId={companyId} documentId={doc.id} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
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
