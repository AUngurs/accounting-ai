import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import EditAccountModal from "../components/EditAccountModal";
import { notify } from "../utils/notify";
import { Table } from "react-bootstrap";

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { companyId } = useCompany();

  // Get accounts
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyId}/accounts`)
      .then((res) => setAccounts(res.data))
      .catch((err) => console.error(err));
  }, [companyId]);

  // Set default accounts
  const handleSet = async () => {
    if (!window.confirm("Vai gribat iestatīt noklusējuma kontus? Tiks dzēsts pašreizējais kontu plāns!")) {
      return;
    }
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/accounts/set`);
      setAccounts(res.data.accounts);
      notify.success("Noklusējuma konti veiksmīgi iestatīti!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda iestatot noklusējuma kontus");
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Import accounts from Excel file
  const handleImport = async () => {
    if (!file) return alert("Izvēlieties XLSX datni (failu)!");
    const formData = new FormData();
    formData.append("xlsxFile", file);
    if (!window.confirm("Vai gribat importēt kontus? Tiks dzēsts pašreizējais kontu plāns!")) {
      return;
    }
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/accounts/import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const data = res.data;
      setAccounts(data.accounts);
      fileInputRef.current.value = "";
      setFile(null);
      notify.success(`Veiksmīgi importēti ${data.accounts.length} konti!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Importēšana neizdevās.");
    }
  };

  const handleEditClick = (account) => {
    setSelectedAccount(account);
    setShowModal(true);
  };

  // Edit account
  const handleSave = async (updatedAccount) => {
    try {
      const res = await axiosInstance.put(`/companies/${companyId}/accounts/${updatedAccount.id}`, updatedAccount);

      setAccounts((prev) =>
        prev.map((acc) => (acc.id === updatedAccount.id ? res.data : acc)).sort((a, b) => a.code.localeCompare(b.code))
      );
      setShowModal(false);
      setSelectedAccount(null);
      notify.success("Konts veiksmīgi rediģēts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda saglabājot kontu");
    }
  };

  // Delete account
  const handleDelete = async (accountID) => {
    try {
      await axiosInstance.delete(`companies/${companyId}/accounts/${accountID}`);
      setAccounts(accounts.filter((account) => account.id !== accountID));
      notify.success("Konts veiksmīgi dzēsts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  return (
    <React.Fragment>
      <h2 className="mb-3">Kontu plāns</h2>
      <div className="mb-3 d-flex gap-2">
        <button className="btn custom-dark-hover" onClick={handleImport}>
          Importēt Excel
        </button>
        <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleFileChange} className="form-control w-auto" />
        <button className="btn custom-dark-hover" onClick={handleSet}>
          Iestatīt noklusējuma kontus
        </button>
      </div>

      <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "52%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "20%" }} />
          <col style={{ width: "38px" }} />
        </colgroup>
        <thead>
          <tr className="align-middle">
            <th>Kods</th>
            <th>Nosaukums</th>
            <th>Analītiskais/Sintētiskais</th>
            <th>Aktīva/Pasīva/Operāciju</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((acc) => (
            <tr key={acc.id} className="align-middle">
              <td>{acc.code}</td>
              <td>{acc.name}</td>
              <td>{acc.type}</td>
              <td>{acc.category}</td>
              <td>
                <div className="d-flex justify-content-evenly">
                  <button className="btn p-0 border-0" onClick={() => handleEditClick(acc)}>
                    <i className="bi bi-pencil-square"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <EditAccountModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        account={selectedAccount}
        onSave={handleSave}
        onDelete={handleDelete}
        accounts={accounts}
      />
    </React.Fragment>
  );
}
