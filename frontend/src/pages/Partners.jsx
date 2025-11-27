import React from "react";
import { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import EditPartnerModal from "../components/EditPartnerModal";
import { notify } from "../utils/notify";
import { Table } from "react-bootstrap";

export default function Partners() {
  const [partnersData, setPartnersData] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({
    key: "fullName",
    direction: "asc",
  });
  const [selectedPartners, setSelectedPartners] = useState(new Set());
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    type: "",
    regNr: "",
    vat: "",
  });
  const { companyId } = useCompany();

  const filteredPartners = partnersData.filter(
    (p) =>
      (filters.name ? p.partner_name.toLowerCase().includes(filters.name.toLowerCase()) : true) &&
      (filters.type ? p.partner_kind_name === filters.type : true) &&
      (filters.regNr ? p.partner_reg_nr?.includes(filters.regNr) : true) &&
      (filters.vat ? p.vat_nr?.includes(filters.vat) : true)
  );

  // Get partners
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyId}/partners`)
      .then((res) => setPartnersData(res.data))
      .catch((err) => console.error(err));
  }, [companyId]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Import Partners from XML
  const handleImport = async () => {
    if (!file) return alert("Izvēlieties XML datni (failu)!");
    const formData = new FormData();
    formData.append("xmlFile", file);
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/partners`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
      if (checked) {
        updated.add(id);
      } else {
        updated.delete(id);
      }
      return updated;
    });
  };

  // Export partners to XML
  const handleExport = () => {};

  const handleEditClick = (partner) => {
    setSelectedPartner(partner);
    setShowModal(true);
  };

  // Edit partner
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

  // Delete individual partner
  const handleDelete = async (partnerID) => {
    try {
      await axiosInstance.delete(`companies/${companyId}/partners/${partnerID}`);
      setPartnersData(partnersData.filter((partner) => partner.id !== partnerID));
      notify.success("Partneris veiksmīgi dzēsts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  // Delete selected multiple partners
  const handleDeleteSelected = async () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst atlasītos partnerus?")) {
      return;
    }
    try {
      const idsToDelete = Array.from(selectedPartners);
      await axiosInstance.post(`/companies/${companyId}/partners/bulk-delete`, {
        ids: idsToDelete,
      });
      setPartnersData(partnersData.filter((partner) => !selectedPartners.has(partner.id)));
      notify.success(`Veiksmīgi dzēsti ${idsToDelete.length} partneri!`);
      setSelectedPartners(new Set());
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  // Sort data in table
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...partnersData].sort((a, b) => {
      let aValue, bValue;

      if (key === "fullName") {
        const aTitle = a.partner_title ? a.partner_title.trim() : "";
        const bTitle = b.partner_title ? b.partner_title.trim() : "";

        aValue = aTitle ? `${a.partner_name.trim()}, ${aTitle}` : a.partner_name.trim();
        bValue = bTitle ? `${b.partner_name.trim()}, ${bTitle}` : b.partner_name.trim();

        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
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
        <button className="btn custom-dark-hover" onClick={handleImport}>
          Importēt XML
        </button>
        <input type="file" accept=".xml" ref={fileInputRef} onChange={handleFileChange} className="form-control w-auto" />
        {selectedPartners.size > 0 && (
          <React.Fragment>
            <button className="btn custom-dark-hover" onClick={handleExport}>
              Eksportēt XML
            </button>
            <button className="btn custom-red-hover" onClick={handleDeleteSelected}>
              Dzēst {selectedPartners.size} partnerus
            </button>
          </React.Fragment>
        )}
      </div>

      <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed" }}>
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
                  if (e.target.checked) {
                    setSelectedPartners(new Set(partnersData.map((p) => p.id)));
                  } else {
                    setSelectedPartners(new Set());
                  }
                }}
              />
            </th>
            <th style={{ width: "42%", cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("fullName")}>
              Nosaukums/Uzvārds, vārds {sortConfig.key === "fullName" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ width: "10%", cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("partner_kind_name")}>
              Tips {sortConfig.key === "partner_kind_name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ width: "18%", cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("partner_reg_nr")}>
              Reģ. Nr. {sortConfig.key === "partner_reg_nr" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ width: "18%", cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("vat_nr")}>
              PVN Nr. {sortConfig.key === "vat_nr" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
            </th>
            <th style={{ width: "10%", borderBottom: "none" }}></th>
          </tr>
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
                onClick={() =>
                  setFilters({
                    name: "",
                    type: "",
                    regNr: "",
                    vat: "",
                  })
                }
              >
                <i className="bi bi-x-square" style={{ fontSize: "1rem" }}></i>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredPartners.map((partner) => (
            <tr key={partner.id}>
              <td style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedPartners.has(partner.id)}
                  onChange={(e) => togglePartnerSelection(partner.id, e.target.checked)}
                />
              </td>
              <td>{`${partner.partner_name}${partner.partner_title ? ", " + partner.partner_title : ""}`}</td>
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
        </tbody>
      </Table>

      <EditPartnerModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        partner={selectedPartner}
        onSave={handleSave} // function to update the partner in state
        onDelete={handleDelete} // function to delete the partner from state
        partners={partnersData} // full partners array for validation
      />
    </React.Fragment>
  );
}
