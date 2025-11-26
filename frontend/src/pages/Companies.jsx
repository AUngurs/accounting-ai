import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import { useAuth } from "../components/AuthContext";
import EditCompanyModal from "../components/EditCompanyModal";
import AddCompanyModal from "../components/AddCompanyModal";
import UserCard from "../components/UserCard";
import { notify } from "../utils/notify";

export default function Companies() {
  const navigate = useNavigate();

  const { companies, updateCompanies, selectCompany, clearAll: clearCompanies } = useCompany();

  const { logout } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/companies")
      .then((res) => updateCompanies(res.data))
      .catch((err) => console.error(err));
  }, [updateCompanies]);

  const handleSelectCompany = (company) => {
    selectCompany(company.id, company);
    navigate("/documents");
  };

  const handleAddCompany = async (data) => {
    try {
      const res = await axiosInstance.post("/companies", {
        name: data.name.trim(),
      });
      updateCompanies([...companies, res.data]);
      setShowAddModal(false);
      notify.success("Uzņēmums pievienots!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (updatedCompany) => {
    try {
      const res = await axiosInstance.put(`/companies/${updatedCompany.id}`, updatedCompany);
      const updatedList = companies.map((c) => (c.id === updatedCompany.id ? res.data : c)).sort((a, b) => a.name.localeCompare(b.name));
      updateCompanies(updatedList);
      setShowEditModal(false);
      setEditingCompany(null);
      notify.success("Uzņēmums veiksmīgi rediģēts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Kļūda saglabājot kontu");
    }
  };

  const handleDelete = async (companyId) => {
    try {
      await axiosInstance.delete(`companies/${companyId}`);
      updateCompanies(companies.filter((company) => company.id !== companyId));
      notify.success("Uzņēmums veiksmīgi dzēsts!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Dzēšana neizdevās!");
    }
  };

  const handleLogout = () => {
    logout();
    clearCompanies();
    navigate("/login");
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#19221C" }}>
      <div
        className="card p-4 shadow"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "10px",
          maxHeight: "90vh",
        }}
      >
        <UserCard></UserCard>
        <button className="btn btn-success mb-4 w-100" onClick={() => navigate("/user")}>
          Mainīt lietotāja datus
        </button>
        <h2>Izvēlieties uzņēmumu</h2>
        <ul className="list-group mt-3">
          {companies.map((company) => (
            <li key={company.id} className="list-group-item d-flex justify-content-between align-items-center">
              <span style={{ cursor: "pointer" }} onClick={() => handleSelectCompany(company)}>
                {company.name}
              </span>

              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                  setEditingCompany(company);
                  setShowEditModal(true);
                }}
              >
                Rediģēt
              </button>
            </li>
          ))}
        </ul>

        <button className="btn btn-primary mt-3 mb-2 w-100" onClick={() => setShowAddModal(true)}>
          Pievienot uzņēmumu
        </button>

        <button className="btn btn-danger w-100" onClick={handleLogout}>
          Iziet
        </button>
      </div>
      <AddCompanyModal
        show={showAddModal}
        handleClose={() => setShowAddModal(false)}
        company={null}
        companies={companies}
        onSave={handleAddCompany}
      />
      <EditCompanyModal
        show={showEditModal}
        handleClose={() => setShowEditModal(false)}
        company={editingCompany}
        companies={companies}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
