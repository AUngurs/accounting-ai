import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import { useAuth } from "../components/AuthContext";
import CompanyModal from "../components/CompanyModal";
import { notify } from "../utils/Notify";
import { FaPlus, FaBuilding } from "react-icons/fa";
import { MdExitToApp } from "react-icons/md";
import { BiUser } from "react-icons/bi";
import { BsPencilSquare } from "react-icons/bs";

export default function Companies() {
  const navigate = useNavigate();
  const { companies, updateCompanies, selectCompany, clearAll: clearCompanies } = useCompany();
  const { logout, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    axiosInstance.get("/companies")
      .then((res) => updateCompanies(res.data))
      .catch((err) => { console.error(err); notify.error("Neparedzēta servera kļūda"); });
  }, [updateCompanies]);

  const handleSelectCompany = (company) => {
    selectCompany(company.id, company);
    navigate("/documents");
  };

  const closeModal = () => {
    setSelectedCompany(null);
    setShowModal(false);
  };

  const handleAddCompany = async (data) => {
    try {
      const res = await axiosInstance.post("/companies", { name: data.name.trim() });
      const updatedList = [...companies, res.data].sort((a, b) => a.name.localeCompare(b.name));
      updateCompanies(updatedList);
      setShowModal(false);
      notify.success("Uzņēmums pievienots!");
    } catch (err) {
      console.error(err);
      notify.error("Neparedzēta servera kļūda");
    }
  };

  const handleSave = async (updatedCompany) => {
    try {
      const updated = { ...updatedCompany, name: updatedCompany.name.trim() };
      const res = await axiosInstance.put(`/companies/${updated.id}`, updated);
      const updatedList = companies.map((c) => (c.id === updated.id ? res.data : c)).sort((a, b) => a.name.localeCompare(b.name));
      updateCompanies(updatedList);
      setShowModal(false);
      setSelectedCompany(null);
      notify.success("Uzņēmums veiksmīgi rediģēts!");
    } catch (err) {
      console.error(err);
      notify.error("Neparedzēta servera kļūda");
    }
  };

  const handleDelete = async (companyId) => {
    try {
      await axiosInstance.delete(`companies/${companyId}`);
      updateCompanies(companies.filter((company) => company.id !== companyId));
      notify.success("Uzņēmums veiksmīgi dzēsts!");
    } catch (err) {
      console.error(err);
      notify.error("Neparedzēta servera kļūda");
    }
  };

  const handleLogout = () => {
    logout();
    clearCompanies();
    navigate("/login");
  };

  const initials = user ? (user.username || "U").slice(0, 2).toUpperCase() : "U";

  return (
    <div className="companies-shell">
      <div className="companies-panel">
        {/* Header */}
        <div className="companies-header">
          <div className="companies-user-info">
            <div className="companies-avatar">{initials}</div>
            <div>
              <div className="companies-user-name">{user?.username}</div>
              <div className="companies-user-email">{user?.email}</div>
            </div>
            <div className="companies-user-actions">
              <button
                className="btn-app-outline btn-app-sm"
                onClick={() => navigate("/user")}
                title="Rediģēt profilu"
              >
                <BiUser />
              </button>
              <button
                className="btn-app-danger btn-app-sm"
                onClick={handleLogout}
                title="Iziet"
              >
                <MdExitToApp />
              </button>
            </div>
          </div>
          <div className="companies-title">Izvēlieties uzņēmumu</div>
        </div>

        {/* Company list */}
        <div className="companies-list">
          {companies.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 1rem", fontSize: "0.875rem" }}>
              Nav neviena uzņēmuma. Pievienojiet pirmo!
            </div>
          )}
          {companies.map((company) => (
            <div
              key={company.id}
              className="company-item"
              onClick={() => handleSelectCompany(company)}
            >
              <div className="company-item-icon">
                <FaBuilding />
              </div>
              <span className="company-item-name">{company.name}</span>
              <button
                className="btn-app-outline btn-app-sm company-item-edit"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCompany(company);
                  setShowModal(true);
                }}
                title="Rediģēt"
              >
                <BsPencilSquare />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="companies-footer">
          <button className="btn-app" style={{ flex: 1 }} onClick={() => setShowModal(true)}>
            <FaPlus /> Pievienot uzņēmumu
          </button>
        </div>
      </div>

      <CompanyModal
        show={showModal}
        handleClose={closeModal}
        company={selectedCompany}
        onSave={selectedCompany ? handleSave : handleAddCompany}
        onDelete={handleDelete}
        companies={companies}
      />
    </div>
  );
}
