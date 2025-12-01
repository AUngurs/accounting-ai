import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import { notify } from "../../utils/notify";

export const useDocuments = (companyId) => {
  const [docsData, setDocsData] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: "doc_date", direction: "desc" });
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
      const res = await axiosInstance.post(`/companies/${companyId}/documents`, newDoc);
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
  const handleImport = async (file) => {
    if (!file) return alert("Izvēlieties XML datni (failu)!");
    const formData = new FormData();
    formData.append("xmlFile", file);

    try {
      const res = await axiosInstance.post(`/companies/${companyId}/documents/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocsData((prev) => [...prev, ...res.data.newDocuments]);
      notify.success(`Veiksmīgi importēti ${res.data.newDocuments.length} finanšu dokumenti!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Import failed!");
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
    handleImport,
    handleDeleteSelected,
  };
};
