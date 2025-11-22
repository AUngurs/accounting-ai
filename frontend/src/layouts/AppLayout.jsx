import Sidebar from "../components/Sidebar";

import "../styles/AppLayout.css";

export default function AppLayout({ children }) {
  return (
    <div className="container-fluid p-0">
      <div className="row g-0">
        <div className="col-auto">
          <Sidebar />
        </div>

        <div className="col" style={{ minHeight: "100vh" }}>
          <div className="p-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
