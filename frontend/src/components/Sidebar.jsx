import { useNavigate } from "react-router-dom";

import "../styles/Sidebar.css";

export default function Sidebar({ setActivePage }) {
    const navigate = useNavigate();

    const profile = {
        name: "Artūrs Ungurs",
        email: "arturs@example.com",
    };

    return (
      <div className="sidebar d-flex flex-column p-3">
        <button className="btn btn-outline-light mt-2" onClick={() => navigate('/company')}>
          Mainīt uzņēmumu
        </button>

        <div className="my-4 fw-bold text-light">SIA "Piemērs"</div>

        <div className="card mb-4 bg-secondary text-light">
          <div className="card-body p-3">
            <h6 className="card-title mb-1 fw-bold">{profile.name}</h6>
            <p className="card-subtitle small">{profile.email}</p>
          </div>
        </div>

        <nav className="nav flex-column gap-2">
          <button className="btn btn-outline-light text-start" onClick={() => setActivePage("financial")}>
            Finanšu dokumenti
          </button>
          <button className="btn btn-outline-light text-start" onClick={() => setActivePage("partners")}>
            Partneri
          </button>
          <button className="btn btn-outline-light text-start" onClick={() => setActivePage("accounts")}>
            Kontu plāns
          </button>
        </nav>
      </div>
    );
}