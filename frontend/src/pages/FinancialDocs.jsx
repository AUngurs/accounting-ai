import React from "react";
import { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";

export default function FinancialDocs() {
  const [docsData, setDocsData] = useState([]);
  const [partnersData, setPartnersData] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sortConfig, setSortConfig] = useState({
    key: "doc_date",
    direction: "desc",
  });
  const [selectedDocs, setSelectedDocs] = useState(new Set());

  const { currentCompany } = useCompany();
  const companyID = currentCompany.id;

  // Get Documents
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyID}/documents`)
      .then((res) => setDocsData(res.data))
      .catch((err) => console.error(err));
  }, [companyID]);

  // Get Partners
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyID}/partners`)
      .then((res) => setPartnersData(res.data))
      .catch((err) => console.error(err));
  }, [companyID]);

  const partnerMap = {};
  partnersData.forEach((p) => {
    partnerMap[p.id] = `${p.partner_name}${
      p.partner_title ? ", " + p.partner_title : ""
    } `;
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleImport = async () => {
    if (!file) return alert("Izvēlieties XML datni (failu)!");
    const formData = new FormData();
    formData.append("xmlFile", file);
    try {
      const res = await axiosInstance.post(
        `/companies/${companyID}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const data = res.data;
      setDocsData((prev) => [...prev, ...data.newDocuments]);
      fileInputRef.current.value = "";
      setFile(null);
      alert(
        `Veiksmīgi importēti ${data.newDocuments.length} finanšu dokumenti.`
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Import failed!");
    }
  };

  const handleDelete = async (documentID) => {
    const confirmed = window.confirm(
      "Vai tiešām vēlaties dzēst finanšu dokumentu?"
    );
    if (!confirmed) return;

    try {
      await axiosInstance.delete(
        `/companies/${companyID}/documents/${documentID}`
      );
      setDocsData(docsData.filter((doc) => doc.id !== documentID));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  const handleDeleteSelected = async () => {
    if (
      !window.confirm("Vai tiešām vēlaties dzēst atlasītos finanšu dokumentus?")
    ) {
      return;
    }

    try {
      const idsToDelete = Array.from(selectedDocs);
      await axiosInstance.post(
        `/companies/${companyID}/documents/bulk-delete`,
        {
          ids: idsToDelete,
        }
      );
      setDocsData(docsData.filter((doc) => !selectedDocs.has(doc.id)));
      setSelectedDocs(new Set());
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...docsData].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === "partner_id") {
        aValue = partnerMap[aValue] || "";
        bValue = partnerMap[bValue] || "";
      }

      if (key === "doc_date") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (key === "doc_amount") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setDocsData(sorted);
    setSortConfig({ key, direction });
  };

  return (
    <React.Fragment>
      <h2 className="mb-3">Finanšu dokumenti</h2>
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
        {selectedDocs.size > 0 && (
          <button className="btn btn-danger" onClick={handleDeleteSelected}>
            Dzēst atlasītos dokumentus
          </button>
        )}
      </div>

      {docsData.length === 0 ? (
        <p></p>
      ) : (
        <div className="table-responsive rounded-1">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr className="align-middle">
                <th style={{ width: "2%" }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedDocs.size === docsData.length &&
                      docsData.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocs(new Set(docsData.map((p) => p.id)));
                      } else {
                        setSelectedDocs(new Set());
                      }
                    }}
                  />
                </th>
                <th
                  style={{ width: "10%", cursor: "pointer" }}
                  onClick={() => handleSort("doc_date")}
                >
                  Datums{" "}
                  {sortConfig.key === "doc_date"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ width: "8%", cursor: "pointer" }}
                  onClick={() => handleSort("doc_id")}
                >
                  Nr.{" "}
                  {sortConfig.key === "doc_id"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ width: "20%", cursor: "pointer" }}
                  onClick={() => handleSort("partner_id")}
                >
                  Partneris{" "}
                  {sortConfig.key === "partner_id"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ width: "6%", cursor: "pointer" }}
                  onClick={() => handleSort("doc_type_abbrev")}
                >
                  Dok. tips{" "}
                  {sortConfig.key === "doc_type_abbrev"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ width: "4%", cursor: "pointer" }}
                  onClick={() => handleSort("doc_currency")}
                >
                  Valūta{" "}
                  {sortConfig.key === "doc_currency"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th
                  style={{ width: "10%", cursor: "pointer" }}
                  onClick={() => handleSort("doc_amount")}
                >
                  Summa{" "}
                  {sortConfig.key === "doc_amount"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th style={{ width: "30%" }}>Piezīmes</th>
                <th style={{ width: "10%" }}></th>
              </tr>
            </thead>
            <tbody>
              {docsData.map((doc) => (
                <tr key={doc.id} className="align-middle">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedDocs);
                        if (e.target.checked) {
                          newSet.add(doc.id);
                        } else {
                          newSet.delete(doc.id);
                        }
                        setSelectedDocs(newSet);
                      }}
                    />
                  </td>
                  <td>{new Date(doc.doc_date).toLocaleDateString("en-GB")}</td>
                  <td>{doc.doc_id}</td>
                  <td>{partnerMap[doc.partner_id] || ""}</td>
                  <td>{doc.doc_type_abbrev}</td>
                  <td>{doc.doc_currency}</td>
                  <td>{doc.doc_amount}</td>
                  <td>{doc.doc_comments}</td>
                  <td
                    style={{ display: "flex", justifyContent: "space-evenly" }}
                  >
                    <button className="btn btn-success btn-sm ms-2">
                      Rediģēt
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(doc.id)}
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
