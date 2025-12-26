import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import { useAuth } from "../components/AuthContext";
import CompanyModal from "../components/CompanyModal";
import UserCard from "../components/UserCard";
import { notify } from "../utils/Notify";
import { FaPlus } from "react-icons/fa";
import { MdExitToApp } from "react-icons/md";

export default function Companies() {
  const navigate = useNavigate();

  const {
    companies,
    updateCompanies,
    selectCompany,
    clearAll: clearCompanies,
  } = useCompany(); // Iegūst uzņēmumu sarakstu un metodes no CompanyContext

  const { logout } = useAuth(); // Iegūst logout funkciju no AuthContext

  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Saņem uzņēmumus no servera un atjauno CompanyContext
  useEffect(() => {
    axiosInstance
      .get("/companies")
      .then((res) => updateCompanies(res.data))
      .catch((err) => console.error(err));
  }, [updateCompanies]);

  // Izvēlas uzņēmumu un pāriet uz dokumentu lapu
  const handleSelectCompany = (company) => {
    selectCompany(company.id, company);
    navigate("/documents");
  };

  // Aizver modal logu un notīra izvēlēto uzņēmumu
  const closeModal = () => {
    setSelectedCompany(null);
    setShowModal(false);
  };

  // Pievieno jaunu uzņēmumu
  const handleAddCompany = async (data) => {
    try {
      const res = await axiosInstance.post("/companies", {
        name: data.name.trim(),
      });
      const updatedList = [...companies, res.data].sort((a, b) =>
        a.name.localeCompare(b.name)
      ); // Sakārto pēc nosaukuma
      updateCompanies(updatedList);
      setShowModal(false);
      notify.success("Uzņēmums pievienots!");
    } catch (err) {
      console.error(err);
    }
  };

  // Saglabā rediģēto uzņēmumu
  const handleSave = async (updatedCompany) => {
    try {
      const updated = { ...updatedCompany, name: updatedCompany.name.trim() }; // Noņem liekās atstarpes nosaukumā
      const res = await axiosInstance.put(`/companies/${updated.id}`, updated);
      const updatedList = companies
        .map((c) => (c.id === updated.id ? res.data : c))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sakārto pēc nosaukuma
      updateCompanies(updatedList);
      setShowModal(false);
      setSelectedCompany(null);
      notify.success("Uzņēmums veiksmīgi rediģēts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda saglabājot kontu");
    }
  };

  // Dzēš uzņēmumu
  const handleDelete = async (companyId) => {
    try {
      await axiosInstance.delete(`companies/${companyId}`);
      updateCompanies(companies.filter((company) => company.id !== companyId)); // Filtrē dzēsto uzņēmumu
      notify.success("Uzņēmums veiksmīgi dzēsts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  // Iziet no sistēmas
  const handleLogout = () => {
    logout();
    clearCompanies(); // Notīra uzņēmumu CompanyContext
    navigate("/login");
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", backgroundColor: "#021526" }}
    >
      <div
        className="card p-4 shadow"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "10px",
          maxHeight: "90vh",
        }}
      >
        <UserCard></UserCard> {/* Rāda lietotāja informāciju */}
        <button
          className="btn custom-dark-hover mb-4 w-100"
          onClick={() => navigate("/user")}
        >
          <i className="bi bi-pencil-square me-2" />
          Mainīt lietotāja datus
        </button>
        <h2>Izvēlieties uzņēmumu</h2>
        <ul className="list-group mt-3">
          {companies.map((company) => (
            <li
              key={company.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span
                style={{ cursor: "pointer" }}
                onClick={() => handleSelectCompany(company)}
              >
                {company.name}
              </span>
              <button
                className="btn btn-sm custom-light-hover"
                onClick={() => {
                  setSelectedCompany(company);
                  setShowModal(true);
                }}
              >
                <i className="bi bi-pencil-square" />
              </button>
            </li>
          ))}
        </ul>
        <button
          className="btn custom-dark-hover mt-3 mb-1 w-100"
          onClick={() => setShowModal(true)}
        >
          <FaPlus className="me-1" /> Pievienot uzņēmumu
        </button>
        <button className="btn custom-red-hover w-100" onClick={handleLogout}>
          <MdExitToApp className="me-1" /> Iziet
        </button>
      </div>
      <CompanyModal
        show={showModal}
        handleClose={closeModal}
        company={selectedCompany}
        onSave={selectedCompany ? handleSave : handleAddCompany} // Ja izvēlēts uzņēmums, saglabā; ja nav, pievieno
        onDelete={handleDelete}
        companies={companies}
      />
    </div>
  );
}
