import { useNavigate, useLocation } from "react-router-dom";
import { useCompany } from "../components/CompanyContext";
import { useAuth } from "../components/AuthContext";
import { IoDocumentText } from "react-icons/io5";
import { MdBusinessCenter, MdExitToApp } from "react-icons/md";
import { FaChartBar } from "react-icons/fa6";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { company } = useCompany();
  const { user } = useAuth();

  const navItems = [
    { path: "/documents", label: "Finanšu dokumenti", icon: <IoDocumentText className="nav-icon" /> },
    { path: "/partners", label: "Partneri", icon: <MdBusinessCenter className="nav-icon" /> },
    { path: "/accounts", label: "Kontu plāns", icon: <FaChartBar className="nav-icon" /> },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-name">Accounting<span style={{ color: "#818cf8" }}>AI</span></div>
        <div className="sidebar-brand-company">{company?.name || "—"}</div>
      </div>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user.username}</div>
          <div className="sidebar-user-email">{user.email}</div>
        </div>
      )}

      <div className="sidebar-nav">
        <div className="sidebar-nav-label">Navigācija</div>
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`sidebar-nav-item${pathname === item.path ? " active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button className="sidebar-bottom-item" onClick={() => navigate("/companies")}>
          <MdExitToApp style={{ fontSize: "1rem" }} />
          Mani uzņēmumi
        </button>
      </div>
    </nav>
  );
}
