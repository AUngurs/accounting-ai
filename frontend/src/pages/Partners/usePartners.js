import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import { notify } from "../../utils/Notify";
import { useLoading } from "../../components/LoadingContext";

export const usePartners = (companyId, ROW_HEIGHT, VISIBLE_ROWS, scrollTop) => {
  const [partnersData, setPartnersData] = useState([]);
  const [filters, setFilters] = useState({ name: "", type: "", regNr: "", vat: "" });
  const [sortConfig, setSortConfig] = useState({ key: "fullName", direction: "asc" });
  const [selectedPartners, setSelectedPartners] = useState(new Set());
  const { setLoading } = useLoading();

  /*
    Funkcija partneru iegūšanai no servera
    useCallback nodrošina, ka funkcija netiek saukta katru renderēšanas reizi,
    un to var izmantot iekš useEffect
   */
  const fetchPartners = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/companies/${companyId}/partners`);
      setPartnersData(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [companyId]);

  // Automātiska partneru iegūšana pie hook ielādes
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Filtrē partnerus pēc ievadītajiem kritērijiem
  const filteredPartners = partnersData.filter(
    (p) =>
      (!filters.name || p.formatted_name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.type || p.partner_kind_name === filters.type) &&
      (!filters.regNr || p.partner_reg_nr?.includes(filters.regNr)) &&
      (!filters.vat || p.vat_nr?.includes(filters.vat))
  );

  // Kārtošana pēc izvēlētā lauka un virziena
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

  // Maina kārtošanas konfigurāciju. Ja tiek klikšķināts uz jau kārtotā lauka, apgriež virzienu
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Partnera pievienošana. POST uz serveri un lokāla atjaunošana
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

  // Partnera rediģēšana. PUT uz serveri un lokāla atjaunošana
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

  // Partnera dzēšana. DELETE uz serveri un lokāla atjaunošana
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

  /*
    - XML partneru importēšana
    - POST ar multipart/form-data
    - Papildina lokālos partnerus ar jauniem
    - Ziņo par importētajiem un jau eksistējošajiem
   */
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

  /*
    - Partneru eksportēšana
    - Atlasīto ID masīvs tiek nosūtīts POST
    - Saņemtais blob tiek lejupielādēts kā XML
   */
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

  /*
    - Bulk dzēšana
    - Atlasītie partneri tiek dzēsti uz servera
    - Lokāli tiek filtrēti dzēstie
   */
  const handleDeleteSelected = async () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst atlasītos partnerus?")) return;
    try {
      const idsToDelete = Array.from(selectedPartners);
      const response = await axiosInstance.post(`/companies/${companyId}/partners/bulk-delete`, { ids: idsToDelete });
      const { deletedCount, deletedRows } = response.data;
      const deletedIds = deletedRows.map((p) => p.id);
      setPartnersData((prev) => prev.filter((p) => !deletedIds.includes(p.id)));
      setSelectedPartners(new Set());
      notify.success(`Veiksmīgi dzēsti ${deletedCount} partneri!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  // Virtuāli redzamās rindas aprēķins priekš tabulas
  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
  const endIndex = Math.min(sortedPartners.length, startIndex + VISIBLE_ROWS);
  const visibleRows = sortedPartners.slice(startIndex, endIndex);

  // Hook atgriež nepieciešamos datus un funkcijas komponentei
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
