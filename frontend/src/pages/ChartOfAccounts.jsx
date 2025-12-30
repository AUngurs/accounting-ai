import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import AccountModal from "../components/AccountModal";
import { notify } from "../utils/Notify";
import { Table, Button, InputGroup, Form, Dropdown } from "react-bootstrap";
import { FaDownload } from "react-icons/fa";
import { GrPowerReset } from "react-icons/gr";

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { companyId } = useCompany(); // Iegūst uzņēmuma ID no CompanyContext

  // Ielādē kontus no servera pie komponenta ielādes
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyId}/accounts`)
      .then((res) => setAccounts(res.data))
      .catch((err) => console.error(err));
  }, [companyId]);

  // Iestata noklusējuma kontus, izdzēšot pašreizējos
  const handleSet = async () => {
    if (!window.confirm("Vai gribat iestatīt noklusējuma kontus? Tiks dzēsts pašreizējais kontu plāns!")) return;
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/accounts/set`);
      setAccounts(res.data.accounts); // Atjauno kontus ar servera atbildi
      notify.success("Noklusējuma konti veiksmīgi iestatīti!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda iestatot noklusējuma kontus");
    }
  };

  // Saglabā failu stāvoklī, kad izvēlēts
  const handleFileChange = (e) => setFile(e.target.files[0]);

  // Importē kontus no Excel faila
  const handleImport = async () => {
    if (!file) return alert("Izvēlieties XLSX datni (failu)!");
    const formData = new FormData();
    formData.append("xlsxFile", file); // pievieno failu formData
    if (!window.confirm("Vai gribat importēt kontus? Tiks dzēsts pašreizējais kontu plāns!")) return;
    try {
      const res = await axiosInstance.post(`/companies/${companyId}/accounts/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data;
      setAccounts(data); // atjauno kontus ar importēto datu sarakstu
      fileInputRef.current.value = ""; // notīra file input vizuāli
      setFile(null); // notīra faila stāvokli
      notify.success(`Veiksmīgi importēti ${data.length} konti!`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Importēšana neizdevās.");
    }
  };

  // Sagatavo kontu rediģēšanai
  const handleEditClick = (account) => {
    setSelectedAccount(account);
    setShowModal(true);
  };

  // Saglabā rediģēto kontu
  const handleSave = async (updatedAccount) => {
    try {
      const res = await axiosInstance.put(`/companies/${companyId}/accounts/${updatedAccount.id}`, updatedAccount);
      setAccounts((prev) =>
        prev.map((acc) => (acc.id === updatedAccount.id ? res.data : acc)).sort((a, b) => a.code.localeCompare(b.code))
      ); // aizvieto atjaunoto kontu un sakārto pēc koda
      setShowModal(false);
      setSelectedAccount(null);
      notify.success("Konts veiksmīgi rediģēts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda saglabājot kontu");
    }
  };

  // Dzēš kontu
  const handleDelete = async (accountID) => {
    try {
      await axiosInstance.delete(`companies/${companyId}/accounts/${accountID}`);
      setAccounts(accounts.filter((account) => account.id !== accountID)); // filtrē dzēsto kontu ārā
      notify.success("Konts veiksmīgi dzēsts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  // Atceļ faila izvēli importēšanai
  const handleCancel = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  // Atver failu dialogu, iestatot tikai xlsx tipus
  const handleTypeSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = ".xlsx";
      fileInputRef.current.click();
    }
  };

  const closeModal = () => {
    setSelectedAccount(null);
    setShowModal(false);
  };

  return (
    <React.Fragment>
      <h2 className="mb-3">Kontu plāns</h2>

      <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
        {/* Slēpts file input */}
        <Form.Control type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
        <InputGroup className="w-auto">
          {!file && (
            <Dropdown>
              <Dropdown.Toggle className="custom-dark-hover">
                <FaDownload className="me-1" /> Importēt
              </Dropdown.Toggle>
              {/* Izvēle importam */}
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleTypeSelect}>Excel</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          )}

          {file && ( // Ja fails izvēlēts, rāda Atcelt un Importēt pogas
            <React.Fragment>
              <Button className="custom-red-hover" onClick={handleCancel}>
                Atcelt
              </Button>
              <Form.Control value={file.name} readOnly className="bg-light" />
              <Button className="custom-dark-hover" onClick={handleImport}>
                Importēt
              </Button>
            </React.Fragment>
          )}
        </InputGroup>
        {/* Noklusējuma kontu iestatīšana */}
        <Button className="custom-red-hover" onClick={handleSet}>
          <GrPowerReset className="me-1" /> Iestatīt noklusējuma kontus
        </Button>{" "}
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
          {accounts.map(
            (
              acc // iet cauri kontiem un parāda katru rindu
            ) => (
              <tr key={acc.id} className="align-middle">
                <td>{acc.code}</td>
                <td>{acc.name}</td>
                <td>{acc.type}</td>
                <td>{acc.category}</td>
                <td>
                  <div className="d-flex justify-content-evenly">
                    <button
                      className="btn btn-sm custom-dark-hover"
                      style={{ padding: "0.15rem 0.25rem", fontSize: "0.85rem", lineHeight: 1 }}
                      onClick={() => handleEditClick(acc)}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </Table>

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
