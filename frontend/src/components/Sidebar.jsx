import { useNavigate } from "react-router-dom";
import { useCompany } from "./CompanyContext";
import UserCard from "./UserCard";

import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  const { company } = useCompany();

  const handleCompanyChange = () => {
    navigate("/companies");
  };

  return (
    <div className="sidebar d-flex flex-column p-3 position-sticky top-0" style={{ width: "250px", flexShrink: 0, height: "100vh" }}>
      <button className="btn btn-outline-light mt-2" onClick={handleCompanyChange}>
        Mani uzņēmumi
      </button>

      <div className="my-4 fw-bold text-light">{company.name || "Loading..."}</div>
      <UserCard></UserCard>

      <nav className="nav flex-column gap-2">
        <button className="btn btn-outline-light text-start" onClick={() => navigate("/documents")}>
          Finanšu dokumenti
        </button>
        <button className="btn btn-outline-light text-start" onClick={() => navigate("/partners")}>
          Partneri
        </button>
        <button className="btn btn-outline-light text-start" onClick={() => navigate("/accounts")}>
          Kontu plāns
        </button>
      </nav>
    </div>
  );
}
