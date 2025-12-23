import Sidebar from "./Sidebar";
import "../styles/AppLayout.css";

// AppLayout komponente nodrošina galveno lapas izkārtojumu ar sidebar un saturu
export default function AppLayout({ children }) {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar daļa, kas saglabā savu izmēru un netiek samazināta */}
      <div style={{ flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Galvenā satura daļa, kas aizņem atlikušo vietu un atbalsta horizontālo scroll */}
      <div style={{ flexGrow: 1, overflowX: "auto" }}>
        <div className="p-3">{children}</div> {/* Nodrošina padding saturam */}
      </div>
    </div>
  );
}
