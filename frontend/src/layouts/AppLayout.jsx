import Sidebar from "../components/Sidebar";

import "../styles/AppLayout.css";

export default function AppLayout({ children }) {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <div style={{ flexShrink: 0 }}>
        <Sidebar />
      </div>

      <div style={{ flexGrow: 1, overflowX: "auto" }}>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}
