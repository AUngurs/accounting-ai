import { useState } from "react";
import Sidebar from "../components/Sidebar";
import FinancialDocs from "../pages/FinancialDocs";
import Partners from "../pages/Partners";
import ChartOfAccounts from "../pages/ChartOfAccounts";

import "../styles/AppLayout.css";

function App() {
  const [activePage, setActivePage] = useState("financial");

  let pageTitle;
  let content;

  if(activePage === "financial"){
    pageTitle = "Finanšu dokumenti";
    content = <FinancialDocs />;
  } else if(activePage === "partners"){
    pageTitle = "Partneri";
    content = <Partners />;
  } else if(activePage === "accounts"){
    pageTitle = "Kontu plāns";
    content = <ChartOfAccounts />;
  }

  return (
    <div className="app-layout">
      <Sidebar setActivePage={setActivePage} />
      <div className="app-content d-flex flex-column ps-4">
        <div className="title mt-2 mb-3">
          <h1>{ pageTitle }</h1>
        </div>
        <div className="content flex-grow-1 rounded-3 p-3">
          { content }
        </div>
      </div>
    </div>
  );
}

export default App;
