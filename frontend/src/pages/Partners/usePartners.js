import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import { notify } from "../../utils/notify";
import { useLoading } from "../../components/LoadingContext";

export const usePartners = (companyId, ROW_HEIGHT, VISIBLE_ROWS, scrollTop) => {
  const [partnersData, setPartnersData] = useState([]);
  const [filters, setFilters] = useState({ name: "", type: "", regNr: "", vat: "" });
  const [sortConfig, setSortConfig] = useState({ key: "fullName", direction: "asc" });
  const [selectedPartners, setSelectedPartners] = useState(new Set());
  const { setLoading } = useLoading();

  const fetchPartners = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/companies/${companyId}/partners`);
      setPartnersData(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [companyId]);
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);
  const filteredPartners = partnersData.filter(
    (p) =>
      (!filters.name || p.formatted_name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.type || p.partner_kind_name === filters.type) &&
      (!filters.regNr || p.partner_reg_nr?.includes(filters.regNr)) &&
      (!filters.vat || p.vat_nr?.includes(filters.vat))
  );
  const sortedPartners = [...filteredPartners].sort((a, b) => {
    let aValue, bValue;
    if (sortConfig.key === "fullName") {
      aValue = a.formatted_name.toLowerCase();
      bValue = b.formatted_name.toLowerCase();
    } else {
      aValue = (a[sortConfig.key] || "").toString().toLowerCase();
      bValue = (b[sortConfig.key] || "").toString().toLowerCase();
    }
    return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };
  const handleCreate = async (newPartner) => {
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/partners`, newPartner);
      setPartnersData((prev) => [...prev, res.data]);
      notify.success("Partneris veiksmīgi pievienots!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda pievienojot partneri");
    }
  };
  const handleSave = async (updatedPartner) => {
    try {
      const res = await axiosInstance.put(`/companies/${companyId}/partners/${updatedPartner.id}`, updatedPartner);
      setPartnersData((prev) => prev.map((p) => (p.id === updatedPartner.id ? res.data : p)));
      notify.success("Partneris veiksmīgi rediģēts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda saglabājot partneri");
    }
  };
  const handleDelete = async (partnerID) => {
    try {
      await axiosInstance.delete(`companies/${companyId}/partners/${partnerID}`);
      setPartnersData((prev) => prev.filter((p) => p.id !== partnerID));
      notify.success("Partneris veiksmīgi dzēsts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };
  const handleImport = async (file) => {
    if (!file) return alert("Izvēlieties XML datni!");
    setLoading(true);
    const formData = new FormData();
    formData.append("xmlFile", file);
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/partners/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPartnersData((prev) => [...prev, ...res.data.newPartners]);
      const imported = res.data.newPartners.length;
      const skipped = res.data.skippedCount;
      if (skipped > 0) {
        notify.info(`Importēti ${imported} partneri. ${skipped} partneri netika importēti, jo tie jau eksistē.`);
      } else {
        notify.success(`Veiksmīgi importēti ${imported} partneri!`);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Importēšana neizdevās.");
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };
  const handleExport = async () => {
    try {
      const idsToExport = Array.from(selectedPartners);
      const res = await axiosInstance.post(`/companies/${companyId}/partners/export`, { ids: idsToExport }, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `partners_selected_${companyId}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("Eksports neizdevās");
    }
  };
  const handleDeleteSelected = async () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst atlasītos partnerus?")) return;
    try {
      const idsToDelete = Array.from(selectedPartners);
      await axiosInstance.post(`/companies/${companyId}/partners/bulk-delete`, { ids: idsToDelete });
      setPartnersData((prev) => prev.filter((p) => !selectedPartners.has(p.id)));
      setSelectedPartners(new Set());
      notify.success(`Veiksmīgi dzēsti ${idsToDelete.length} partneri!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
  const endIndex = Math.min(sortedPartners.length, startIndex + VISIBLE_ROWS);
  const visibleRows = sortedPartners.slice(startIndex, endIndex);

  return {
    partnersData,
    sortedPartners,
    visibleRows,
    startIndex,
    endIndex,
    selectedPartners,
    setSelectedPartners,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    handleCreate,
    handleSave,
    handleDelete,
    handleImport,
    handleExport,
    handleDeleteSelected,
  };
};
