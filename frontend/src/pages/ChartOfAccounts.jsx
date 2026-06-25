import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import AccountModal from "../components/AccountModal";
import { notify } from "../utils/Notify";
import { Form, InputGroup, Dropdown } from "react-bootstrap";
import { FaDownload } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";
import { BsPencilSquare } from "react-icons/bs";

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { companyId } = useCompany();

  useEffect(() => {
    axiosInstance.get(`/companies/${companyId}/accounts`)
      .then((res) => setAccounts(res.data))
      .catch((err) => { console.error(err); notify.error("Neparedzēta servera kļūda"); });
  }, [companyId]);

  const handleSet = async () => {
    if (!window.confirm("Vai gribat iestatīt noklusējuma kontus? Tiks dzēsts pašreizējais kontu plāns!")) return;
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/accounts/set`);
      setAccounts(res.data.accounts);
      notify.success("Noklusējuma konti veiksmīgi iestatīti!");
    } catch (err) { console.error(err); notify.error("Neparedzēta servera kļūda"); }
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleImport = async () => {
    if (!file) return alert("Izvēlieties XLSX datni (failu)!");
    const formData = new FormData();
    formData.append("xlsxFile", file);
    if (!window.confirm("Vai gribat importēt kontus? Tiks dzēsts pašreizējais kontu plāns!")) return;
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/accounts/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data;
      setAccounts(data);
      fileInputRef.current.value = "";
      setFile(null);
      notify.success(`Veiksmīgi importēti ${data.length} konti!`);
    } catch (err) { console.error(err); notify.error("Neparedzēta servera kļūda"); }
  };

  const handleEditClick = (account) => { setSelectedAccount(account); setShowModal(true); };

  const handleSave = async (updatedAccount) => {
    try {
      const res = await axiosInstance.put(`/companies/${companyId}/accounts/${updatedAccount.id}`, updatedAccount);
      setAccounts((prev) => prev.map((acc) => (acc.id === updatedAccount.id ? res.data : acc)).sort((a, b) => a.code.localeCompare(b.code)));
      setShowModal(false);
      setSelectedAccount(null);
      notify.success("Konts veiksmīgi rediģēts!");
    } catch (err) { console.error(err); notify.error("Neparedzēta servera kļūda"); }
  };

  const handleDelete = async (accountID) => {
    try {
      await axiosInstance.delete(`companies/${companyId}/accounts/${accountID}`);
      setAccounts(accounts.filter((account) => account.id !== accountID));
      notify.success("Konts veiksmīgi dzēsts!");
    } catch (err) { console.error(err); notify.error("Neparedzēta servera kļūda"); }
  };

  const handleCancel = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleTypeSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = ".xlsx";
      fileInputRef.current.click();
    }
  };

  const closeModal = () => { setSelectedAccount(null); setShowModal(false); };

  return (
    <React.Fragment>
      <h1 className="page-title">Kontu plāns</h1>

      <div className="controls-bar">
        <Form.Control type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
        <InputGroup className="w-auto">
          {!file && (
            <Dropdown>
              <Dropdown.Toggle className="btn-app" as="button">
                <FaDownload /> Importēt
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleTypeSelect}>Excel</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}
          {file && (
            <React.Fragment>
              <button className="btn-app-danger" onClick={handleCancel}>Atcelt</button>
              <Form.Control name="imported-file" value={file.name} readOnly className="bg-light" style={{ maxWidth: 200 }} />
              <button className="btn-app" onClick={handleImport}>Importēt</button>
            </React.Fragment>
          )}
        </InputGroup>
        <button className="btn-app-danger" onClick={handleSet}>
          <GrPowerReset /> Iestatīt noklusējuma kontus
        </button>
      </div>

      <div className="app-card" style={{ overflow: "hidden" }}>
        <table className="app-table" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "8%" }} />
            <col style={{ width: "52%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "38px" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Kods</th>
              <th>Nosaukums</th>
              <th>Analītiskais/Sintētiskais</th>
              <th>Aktīva/Pasīva/Operāciju</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id}>
                <td>{acc.code}</td>
                <td>{acc.name}</td>
                <td>{acc.type}</td>
                <td>{acc.category}</td>
                <td>
                  <button
                    className="btn-app-outline btn-app-sm"
                    onClick={() => handleEditClick(acc)}
                  >
                    <BsPencilSquare />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AccountModal
        show={showModal}
        handleClose={closeModal}
        account={selectedAccount}
        onSave={handleSave}
        onDelete={handleDelete}
        accounts={accounts}
      />
    </React.Fragment>
  );
}
