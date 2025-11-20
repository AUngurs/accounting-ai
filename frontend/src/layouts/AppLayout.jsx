import { Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import FinancialDocs from "../pages/FinancialDocs";
import Partners from "../pages/Partners";
import ChartOfAccounts from "../pages/ChartOfAccounts";

import "../styles/AppLayout.css";

function App() {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <Sidebar />
      <div className="flex-grow-1 p-3">
        <Routes>
          <Route>
            <Route path="/" element={<Navigate to="/documents" replace />} />
            <Route path="/documents" element={<FinancialDocs />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/accounts" element={<ChartOfAccounts />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

export default App;
