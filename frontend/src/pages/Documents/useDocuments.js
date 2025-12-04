import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import { notify } from "../../utils/notify";
import { useCompany } from "../../components/CompanyContext";
import Fuse from "fuse.js";
import { useLoading } from "../../components/LoadingContext";

export const useDocuments = (companyId) => {
  const [docsData, setDocsData] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: "doc_date", direction: "desc" });
  const docTypeOptions = ["Čeks", "Grām.", "Ienāk.b.dok.", "Izej.b.dok.", "Kredītrēķ.", "Rēķ"];
  const docCurrencyOptions = ["DKK", "EUR", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const { company } = useCompany();
  const { setLoading } = useLoading();
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

  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyId}/partners`)
      .then((res) => setPartnersData(res.data))
      .catch((err) => console.error(err));
  }, [companyId]);
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
  const partnerMap = partnersData.reduce((map, p) => {
    map[p.id] = p.formatted_name || "";
    return map;
  }, {});
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
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    if (sortConfig.key === "partner_id") {
      aValue = partnersData.find((p) => p.id === aValue)?.formatted_name || "";
      bValue = partnersData.find((p) => p.id === bValue)?.formatted_name || "";
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
  const handleCreate = async (newDoc) => {
    try {
      const formData = new FormData();
      for (const key in newDoc) {
        if (key === "file") {
          if (newDoc.file) formData.append("file", newDoc.file);
        } else {
          formData.append(key, newDoc[key]);
        }
      }
      const res = await axiosInstance.post(`/companies/${companyId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocsData((prev) => [...prev, res.data]);
      notify.success("Finanšu dokuments veiksmīgi pievienots!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda pievienojot dokumentu");
    }
  };
  const handleSave = async (updatedDoc) => {
    try {
      const res = await axiosInstance.put(`/companies/${companyId}/documents/${updatedDoc.id}`, updatedDoc);
      setDocsData((prev) => prev.map((d) => (d.id === updatedDoc.id ? res.data : d)));
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
  const handleExport = async () => {
    try {
      const idsToExport = Array.from(selectedDocs);
      const res = await axiosInstance.post(`/companies/${companyId}/documents/export`, { ids: idsToExport }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `documents_selected_${companyId}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Eksports neizdevās");
    }
  };
  function mapPartnerName(aiName, partnersData) {
    if (!aiName || partnersData.length === 0) return "";
    const normalize = (str) =>
      str
        .replace(/SIA|A\/S|,/gi, "")
        .replace(/\./g, "")
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .sort()
        .join(" ");
    const fuse = new Fuse(
      partnersData.map((p) => ({
        ...p,
        normalized: normalize(p.formatted_name),
      })),
      {
        keys: ["normalized"],
        threshold: 0.3,
        includeScore: true,
      }
    );
    const result = fuse.search(normalize(aiName));
    if (result.length === 0) return "";
    const best = result[0];
    if (best.score > 0.3) return "";
    return best.item.id;
  }
  const handleXmlImport = async (file) => {
    if (!file) return alert("Izvēlieties XML datni (failu)!");
    setLoading(true);
    const formData = new FormData();
    formData.append("xmlFile", file);
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/documents/importxml`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocsData((prev) => [...prev, ...res.data.newDocuments]);
      notify.success(`Veiksmīgi importēti ${res.data.newDocuments.length} finanšu dokumenti!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Import failed!");
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };
  const handlePdfImport = async (file) => {
    if (!file) return alert("Izvēlieties PDF datni!");
    setLoading(true);
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("companyName", company.name);
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/ai/import-pdf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.documents?.length > 0) {
        const aiDoc = res.data.documents[0];

        const matchedPartnerId = mapPartnerName(aiDoc.partner, partnersData);

        const mappedDoc = {
          doc_id: aiDoc.document_number,
          doc_date: aiDoc.document_date,
          doc_type_abbrev: aiDoc.document_type,
          doc_group_abbrev: aiDoc.document_group,
          doc_currency: aiDoc.currency,
          doc_amount: aiDoc.amount,
          doc_comments: aiDoc.notes,
          partner_id: matchedPartnerId,
          is_accounted: false,
        };

        setSelectedDocument({ ...mappedDoc, isNewImport: true });
        setPdfFile(file);
        setShowModal(true);
      }
    } catch (err) {
      console.error("PDF import failed:", err);
      alert(err.response?.data?.error || "Neizdevās importēt PDF!");
    } finally {
      setTimeout(() => setLoading(false), 200);
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

  return {
    docsData,
    partnersData,
    selectedDocs,
    setSelectedDocs,
    filteredDocs,
    filters,
    setFilters,
    sortConfig,
    sortedDocs,
    handleSort,
    partnerMap,
    docTypeOptions,
    docCurrencyOptions,
    handleCreate,
    handleSave,
    handleDelete,
    handleExport,
    handleXmlImport,
    handleDeleteSelected,
    selectedDocument,
    setSelectedDocument,
    showModal,
    setShowModal,
    pdfFile,
    setPdfFile,
    handlePdfImport,
  };
};
