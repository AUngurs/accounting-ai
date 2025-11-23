import React from "react";
import { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";

export default function Partners() {
  const [partnersData, setPartnersData] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({
    key: "fullName",
    direction: "asc",
  });
  const [selectedPartners, setSelectedPartners] = useState(new Set());

  const { companyId } = useCompany();

  // Get Partners
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
      const res = await axiosInstance.post(
        `/companies/${companyId}/partners`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const data = res.data;
      setPartnersData((prev) => [...prev, ...data.newPartners]);
      fileInputRef.current.value = "";
      setFile(null);
      alert(`Veiksmīgi importēti ${data.newPartners.length} partneri.`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Importēšana neizdevās.");
    }
  };

  // Delete individual Partner
  const handleDelete = async (partnerID) => {
    const confirmed = window.confirm("Vai tiešām vēlaties dzēst partneri?");
    if (!confirmed) return;
    try {
      await axiosInstance.delete(
        `companies/${companyId}/partners/${partnerID}`
      );
      setPartnersData(
        partnersData.filter((partner) => partner.id !== partnerID)
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  // Delete selected multiple Partners
  const handleDeleteSelected = async () => {
    if (!window.confirm("Vai tiešām vēlaties dzēst atlasītos partnerus?")) {
      return;
    }
    try {
      const idsToDelete = Array.from(selectedPartners);
      await axiosInstance.post(`/companies/${companyId}/partners/bulk-delete`, {
        ids: idsToDelete,
      });
      setPartnersData(
        partnersData.filter((partner) => !selectedPartners.has(partner.id))
      );
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

        aValue = aTitle
          ? `${a.partner_name.trim()}, ${aTitle}`
          : a.partner_name.trim();
        bValue = bTitle
          ? `${b.partner_name.trim()}, ${bTitle}`
          : b.partner_name.trim();

        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else {
        aValue = (a[key] || "").toString().toLowerCase();
        bValue = (b[key] || "").toString().toLowerCase();
      }

      return direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    setPartnersData(sorted);
    setSortConfig({ key, direction });
  };

  return (
    <React.Fragment>
      <h2 className="mb-3">Partneri</h2>
      <div className="mb-3 d-flex gap-2">
        <input
          type="file"
          accept=".xml"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="form-control w-auto"
        />
        <button className="btn btn-success" onClick={handleImport}>
          Importēt XML
        </button>
        {selectedPartners.size > 0 && (
          <button className="btn btn-danger" onClick={handleDeleteSelected}>
            Dzēst atlasītos partnerus
          </button>
        )}
      </div>

      {partnersData.length === 0 ? (
        <p></p>
      ) : (
        <div className="table-responsive rounded-1">
          <table
            className="table table-striped table-bordered"
            style={{ tableLayout: "fixed" }}
          >
            <thead className="table-dark">
              <tr className="align-middle">
                <th style={{ width: "2%" }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedPartners.size === partnersData.length &&
                      partnersData.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPartners(
                          new Set(partnersData.map((p) => p.id))
                        );
                      } else {
                        setSelectedPartners(new Set());
                      }
                    }}
                  />
                </th>
                <th
                  style={{ width: "48%", cursor: "pointer" }}
                  onClick={() => handleSort("fullName")}
                >
                  Nosaukums/Uzvārds, vārds{" "}
                  {sortConfig.key === "fullName"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ width: "20%", cursor: "pointer" }}
                  onClick={() => handleSort("partner_reg_nr")}
                >
                  Reg. Nr.{" "}
                  {sortConfig.key === "partner_reg_nr"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ width: "20%", cursor: "pointer" }}
                  onClick={() => handleSort("vat_nr")}
                >
                  PVN Nr.{" "}
                  {sortConfig.key === "vat_nr"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th style={{ width: "10%", cursor: "pointer" }}></th>
              </tr>
            </thead>
            <tbody>
              {partnersData.map((partner) => (
                <tr key={partner.id} className="align-middle">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPartners.has(partner.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedPartners);
                        if (e.target.checked) {
                          newSet.add(partner.id);
                        } else {
                          newSet.delete(partner.id);
                        }
                        setSelectedPartners(newSet);
                      }}
                    />
                  </td>
                  <td>{`${partner.partner_name}${
                    partner.partner_title ? ", " + partner.partner_title : ""
                  }`}</td>
                  <td>{partner.partner_reg_nr}</td>
                  <td>{partner.vat_nr}</td>
                  <td
                    style={{ display: "flex", justifyContent: "space-evenly" }}
                  >
                    <button className="btn btn-success btn-sm">Rediģēt</button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(partner.id)}
                    >
                      Dzēst
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </React.Fragment>
  );
}
