import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import PartnerModal from "../components/PartnerModal";
import { notify } from "../utils/notify";
import { Table } from "react-bootstrap";
import "react-virtualized/styles.css"; // default styles

export default function Partners() {
  const [partnersData, setPartnersData] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({ key: "fullName", direction: "asc" });
  const [selectedPartners, setSelectedPartners] = useState(new Set());
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ name: "", type: "", regNr: "", vat: "" });
  const { companyId } = useCompany();

  const ROW_HEIGHT = 24;
  const VISIBLE_ROWS = 29;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Filtering
  const filteredPartners = partnersData.filter(
    (p) =>
      (filters.name ? p.partner_name.toLowerCase().includes(filters.name.toLowerCase()) : true) &&
      (filters.type ? p.partner_kind_name === filters.type : true) &&
      (filters.regNr ? p.partner_reg_nr?.includes(filters.regNr) : true) &&
      (filters.vat ? p.vat_nr?.includes(filters.vat) : true)
  );

  // Virtualization indexes
  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
  const endIndex = Math.min(filteredPartners.length, startIndex + VISIBLE_ROWS);
  const visibleRows = filteredPartners.slice(startIndex, endIndex);

  // Fetch sorted partners
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await axiosInstance.get(`/companies/${companyId}/partners`);
        const sortedData = res.data.sort((a, b) => {
          const formatPartner = (p) =>
            p.partner_kind_name === "Juridiska persona"
              ? `${p.partner_name}${p.partner_title ? ", " + p.partner_title : ""}`
              : `${p.partner_title} ${p.partner_name}`; // Fiziskas personas: surname first

          return formatPartner(a).toLowerCase().localeCompare(formatPartner(b).toLowerCase());
        });

        setPartnersData(sortedData);
      } catch (err) {
        console.error(err);
      }
    };

    fetchPartners();
  }, [companyId]);

  const handleCreateClick = () => {
    setSelectedPartner(null);
    setShowModal(true);
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleImport = async () => {
    if (!file) return alert("Izvēlieties XML datni (failu)!");
    const formData = new FormData();
    formData.append("xmlFile", file);
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/partners/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data;
      setPartnersData((prev) => [...prev, ...data.newPartners]);
      fileInputRef.current.value = "";
      setFile(null);
      notify.success(`Veiksmīgi importēti ${data.newPartners.length} partneri!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Importēšana neizdevās.");
    }
  };

  const togglePartnerSelection = (id, checked) => {
    setSelectedPartners((prev) => {
      const updated = new Set(prev);
      if (checked) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  };

  const handleEditClick = (partner) => {
    setSelectedPartner(partner);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedPartner(null);
    setShowModal(false);
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
      setShowModal(false);
      setSelectedPartner(null);
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

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";

    const sorted = [...partnersData].sort((a, b) => {
      let aValue, bValue;

      if (key === "fullName") {
        const formatPartner = (p) =>
          p.partner_kind_name === "Juridiska persona"
            ? `${p.partner_name}${p.partner_title ? ", " + p.partner_title : ""}`
            : `${p.partner_title} ${p.partner_name}`;

        aValue = formatPartner(a).toLowerCase();
        bValue = formatPartner(b).toLowerCase();
      } else {
        aValue = (a[key] || "").toString().toLowerCase();
        bValue = (b[key] || "").toString().toLowerCase();
      }

      return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });

    setPartnersData(sorted);
    setSortConfig({ key, direction });
  };

  return (
    <React.Fragment>
      <h2 className="mb-3">Partneri</h2>
      <div className="mb-3 d-flex gap-2">
        <button className="btn custom-dark-hover" onClick={handleCreateClick}>
          Jauns
        </button>
        <button className="btn custom-dark-hover" onClick={handleImport}>
          Importēt XML
        </button>
        <input type="file" accept=".xml" ref={fileInputRef} onChange={handleFileChange} className="form-control w-auto" />
        {selectedPartners.size > 0 && (
          <>
            <button className="btn custom-dark-hover" onClick={handleExport}>
              Eksportēt XML
            </button>
            <button className="btn custom-red-hover" onClick={handleDeleteSelected}>
              Dzēst {selectedPartners.size} partnerus
            </button>
          </>
        )}
      </div>
      <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
        <colgroup>
          <col style={{ width: "3%" }} />
          <col style={{ width: "44%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "38px" }} />
        </colgroup>
        <thead>
          <tr className="align-middle">
            <th style={{ textAlign: "center", borderBottom: "none" }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={selectedPartners.size === partnersData.length && partnersData.length > 0}
                onChange={(e) => {
                  if (e.target.checked) setSelectedPartners(new Set(partnersData.map((p) => p.id)));
                  else setSelectedPartners(new Set());
                }}
              />
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("fullName")}>
              Nosaukums/Uzvārds, vārds {sortConfig.key === "fullName" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("partner_kind_name")}>
              Tips {sortConfig.key === "partner_kind_name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("partner_reg_nr")}>
              Reģ. Nr. {sortConfig.key === "partner_reg_nr" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("vat_nr")}>
              PVN Nr. {sortConfig.key === "vat_nr" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ borderBottom: "none" }}></th>
          </tr>
          {/* Filter row */}
          <tr>
            <th></th>
            <th>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Meklēt nosaukumu"
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </th>
            <th>
              <select
                className="form-select form-select-sm"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">Visi</option>
                <option value="Juridiska persona">Juridiska persona</option>
                <option value="Fiziska persona">Fiziska persona</option>
                <option value="Darbinieks">Darbinieks</option>
              </select>
            </th>
            <th>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Reģ. Nr"
                value={filters.regNr}
                onChange={(e) => setFilters({ ...filters, regNr: e.target.value })}
              />
            </th>
            <th>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="PVN Nr"
                value={filters.vat}
                onChange={(e) => setFilters({ ...filters, vat: e.target.value })}
              />
            </th>
            <th className="text-center align-middle p-0">
              <button
                type="button"
                className="btn btn-sm custom-red-hover"
                style={{ padding: "0.15rem 0.25rem", fontSize: "0.85rem", lineHeight: 1 }}
                onClick={() => {
                  setFilters({ name: "", type: "", regNr: "", vat: "" });
                  setSelectedPartners(new Set());
                }}
              >
                <i className="bi bi-x-square" style={{ fontSize: "1rem" }}></i>
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
            <col style={{ width: "44%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "38px" }} />
          </colgroup>
          <tbody>
            {startIndex > 0 && (
              <tr style={{ height: startIndex * ROW_HEIGHT }}>
                <td colSpan={6}></td>
              </tr>
            )}

            {visibleRows.map((partner) => (
              <tr key={partner.id} style={{ height: ROW_HEIGHT }}>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedPartners.has(partner.id)}
                    onChange={(e) => togglePartnerSelection(partner.id, e.target.checked)}
                  />
                </td>
                <td>
                  {partner.partner_kind_name === "Juridiska persona"
                    ? `${partner.partner_name}${partner.partner_title ? ", " + partner.partner_title : ""}`
                    : `${partner.partner_title} ${partner.partner_name}`}
                </td>
                <td>{partner.partner_kind_name}</td>
                <td>{partner.partner_reg_nr}</td>
                <td>{partner.vat_nr}</td>
                <td>
                  <div className="d-flex justify-content-evenly">
                    <button className="btn p-0 border-0" onClick={() => handleEditClick(partner)}>
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {endIndex < filteredPartners.length && (
              <tr style={{ height: (filteredPartners.length - endIndex) * ROW_HEIGHT }}>
                <td colSpan={6}></td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      <PartnerModal
        show={showModal}
        handleClose={closeModal}
        partner={selectedPartner}
        onSave={selectedPartner ? handleSave : handleCreate}
        onDelete={handleDelete}
        partners={partnersData}
      />
    </React.Fragment>
  );
}
