import Sidebar from "./Sidebar";
import "../styles/AppLayout.css";

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-content">
        <div className="app-content-inner">{children}</div>
      </div>
    </div>
  );
}
