import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";
import { useAuth } from "../components/AuthContext";

export default function Companies() {
  const navigate = useNavigate();

  const { companies, updateCompanies, selectCompany, clearAll: clearCompanies } = useCompany();

  const { logout } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

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

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    try {
      const res = await axiosInstance.post("/companies", {
        name: newCompanyName,
      });
      updateCompanies([...companies, res.data]);
      setNewCompanyName("");
      setShowModal(false);
    } catch (err) {
      console.error(err);
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
        <h2>Izvēlieties uzņēmumu</h2>
        <ul className="list-group mt-3">
          {companies.map((company) => (
            <li
              key={company.id}
              className="list-group-item list-group-item-action"
              style={{ cursor: "pointer" }}
              onClick={() => handleSelectCompany(company)}
            >
              {company.name}
            </li>
          ))}
        </ul>

        <button className="btn btn-primary mt-3 mb-2 w-100" onClick={() => setShowModal(true)}>
          Pievienot uzņēmumu
        </button>
        <button className="btn btn-danger w-100" onClick={handleLogout}>
          Iziet
        </button>

        {/* Modal */}
        {showModal && (
          <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Pievienot uzņēmumu</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Uzņēmuma nosaukums"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Atcelt
                  </button>
                  <button className="btn btn-primary" onClick={handleAddCompany}>
                    Saglabāt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
