import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCompany } from "./CompanyContext";

import axiosInstance from "../api/axiosInstance";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();

  const placeholder = {
    user: {
      id: -1,
      username: "Loading...",
      email: "Loading...",
    },
    companies: [
      {
        id: -1,
        name: "placeholder",
      },
    ],
  };

  const [sidebarData, setSidebarData] = useState(placeholder);

  const { companyId, company } = useCompany();

  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyId}/sidebar`)
      .then((res) => setSidebarData(res.data))
      .catch((err) => console.error(err));
  }, [companyId]);

  const handleCompanyChange = () => {
    navigate("/companies");
  };

  return (
    <div
      className="sidebar d-flex flex-column p-3 position-sticky top-0"
      style={{ width: "250px", flexShrink: 0, height: "100vh" }}
    >
      <button
        className="btn btn-outline-light mt-2"
        onClick={handleCompanyChange}
      >
        Mani uzņēmumi
      </button>

      <div className="my-4 fw-bold text-light">
        {company.name || "Loading..."}
      </div>

      <div className="card mb-4 bg-secondary text-light">
        <div className="card-body p-3">
          <h6 className="card-title mb-1 fw-bold">
            {sidebarData.user.username}
          </h6>
          <p className="card-subtitle small">{sidebarData.user.email}</p>
        </div>
      </div>

      <nav className="nav flex-column gap-2">
        <button
          className="btn btn-outline-light text-start"
          onClick={() => navigate("/documents")}
        >
          Finanšu dokumenti
        </button>
        <button
          className="btn btn-outline-light text-start"
          onClick={() => navigate("/partners")}
        >
          Partneri
        </button>
        <button
          className="btn btn-outline-light text-start"
          onClick={() => navigate("/accounts")}
        >
          Kontu plāns
        </button>
      </nav>
    </div>
  );
}
