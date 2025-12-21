import { useNavigate } from "react-router-dom";
import { useCompany } from "../components/CompanyContext";
import UserCard from "../components/UserCard";
import { IoDocumentText } from "react-icons/io5";
import { MdBusinessCenter } from "react-icons/md";
import { FaChartBar } from "react-icons/fa6";
import { MdExitToApp } from "react-icons/md";

import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  const { company } = useCompany();

  const handleCompanyChange = () => {
    navigate("/companies");
  };

  return (
    <div className="sidebar d-flex flex-column p-3 position-sticky top-0">
      <div className="mt-3 mb-4 fw-bold text-light" style={{ fontSize: "1.3rem" }}>
        {company.name || "Loading..."}
      </div>
      <UserCard />

      <nav className="nav flex-column gap-2 mt-4 flex-grow-1">
        <button className="btn custom-dark-hover text-start" onClick={() => navigate("/documents")}>
          <IoDocumentText className="me-2" />
          Finanšu dokumenti
        </button>
        <button className="btn custom-dark-hover text-start" onClick={() => navigate("/partners")}>
          <MdBusinessCenter className="me-2" />
          Partneri
        </button>
        <button className="btn custom-dark-hover text-start" onClick={() => navigate("/accounts")}>
          <FaChartBar className="me-2" />
          Kontu plāns
        </button>

        <button className="btn custom-dark-hover mt-auto" onClick={handleCompanyChange}>
          <MdExitToApp className="me-2" />
          Mani uzņēmumi
        </button>
      </nav>
    </div>
  );
}
