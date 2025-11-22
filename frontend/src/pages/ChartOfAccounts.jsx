import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const companyID = localStorage.getItem("companyId");

  // Get Accounts
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyID}/accounts`)
      .then((res) => setAccounts(res.data))
      .catch((err) => console.error(err));
  }, [setAccounts]);

  // Set default Accounts
  const handleSet = async () => {
    if (
      !window.confirm(
        "Vai gribat iestatīt noklusējuma kontus? Tiks dzēsts pašreizējais kontu plāns"
      )
    ) {
      return;
    }
    const companyID = 1;
    try {
      const res = await axiosInstance.post(
        `/companies/${companyID}/accounts/set`
      );
      setAccounts(res.data.accounts);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda iestatot noklusējuma kontus");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Import custom Accounts from Excel file
  const handleImport = async () => {
    if (!file) return alert("Izvēlieties XLSX datni (failu)!");
    const formData = new FormData();
    formData.append("xlsxFile", file);
    try {
      const res = await axiosInstance.post(
        `/companies/${companyID}/accounts/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const data = res.data;
      setAccounts((prev) => [...prev, ...data.accounts]);
      fileInputRef.current.value = "";
      setFile(null);
      alert(`Veiksmīgi importēti ${data.accounts.length} konti.`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Importēšana neizdevās.");
    }
  };

  return (
    <React.Fragment>
      <h2 className="mb-3">Kontu plāns</h2>
      <div className="mb-3 d-flex gap-2">
        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="form-control w-auto"
        />
        <button className="btn btn-success" onClick={handleImport}>
          Importēt Excel
        </button>
        <button className="btn btn-primary" onClick={handleSet}>
          Iestatīt noklusējuma kontus
        </button>
      </div>

      <div className="table-responsive rounded-1">
        <table
          className="table table-striped table-bordered table-sm"
          style={{ tableLayout: "fixed" }}
        >
          <thead className="table-dark">
            <tr className="align-middle">
              <th style={{ width: "10%" }}>Kods</th>
              <th style={{ width: "40%" }}>Nosaukums</th>
              <th style={{ width: "25%" }}>Analītiskais/Sintētiskais</th>
              <th style={{ width: "25%" }}>Aktīva/Pasīva/Operāciju</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, index) => (
              <tr key={index} className="align-middle">
                <td>{acc.code}</td>
                <td>{acc.name}</td>
                <td>{acc.type}</td>
                <td>{acc.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </React.Fragment>
  );
}
