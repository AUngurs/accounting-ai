import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useCompany } from "../components/CompanyContext";

export default function Companies() {
  const navigate = useNavigate();

  const { currentCompany, setCurrentCompany, companies, setCompanies } =
    useCompany();

  useEffect(() => {
    axiosInstance
      .get("/companies")
      .then((res) => setCompanies(res.data))
      .catch((err) => console.error(err));
  }, [setCompanies]);

  const handleSelectCompany = (company) => {
    setCurrentCompany(company);
    navigate("/documents");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", backgroundColor: "#19221C" }}
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

        <button className="btn btn-danger mt-3 w-100" onClick={handleLogout}>
          Iziet
        </button>
      </div>
    </div>
  );
}
