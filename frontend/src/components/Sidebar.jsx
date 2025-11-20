import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import "../styles/Sidebar.css";

export default function Sidebar() {
    const navigate = useNavigate();

    const placeholder = {
      users: {
        email: " ",
        username: " "
      },
      companies: [
        {
          name: " "
        },
        {
          name: " "
        }
      ]
    };

    const userID = 1;
    const companyID = 1;

    const [sidebarData, setSidebarData] = useState(placeholder);

    useEffect(() => {
      fetch(`http://localhost:5000/api/sidebar/${userID}`)
        .then(res => res.json())
        .then(data => setSidebarData(data))
        .catch(err => console.error(err));
    }, []);

    return (
      <div className="sidebar d-flex flex-column p-3" style={{ width: "250px", flexShrink: 0 }}>
        <button className="btn btn-outline-light mt-2" onClick={() => navigate('/company')}>
          Mainīt uzņēmumu
        </button>

        <div className="my-4 fw-bold text-light">{sidebarData.companies[companyID].name}</div>

        <div className="card mb-4 bg-secondary text-light">
          <div className="card-body p-3">
            <h6 className="card-title mb-1 fw-bold">{sidebarData.users.username}</h6>
            <p className="card-subtitle small">{sidebarData.users.email}</p>
          </div>
        </div>

        <nav className="nav flex-column gap-2">
          <button className="btn btn-outline-light text-start" onClick={() => navigate('/documents')}>
            Finanšu dokumenti
          </button>
          <button className="btn btn-outline-light text-start" onClick={() => navigate('/partners')}>
            Partneri
          </button>
          <button className="btn btn-outline-light text-start" onClick={() => navigate('/accounts')}>
            Kontu plāns
          </button>
        </nav>
      </div>
    );
}