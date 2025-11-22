import React, { createContext, useState, useContext, useEffect } from "react";

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [currentCompany, setCurrentCompany] = useState(() => {
    const saved = localStorage.getItem("companyId");
    return saved ? { id: saved, name: "unknown" } : null;
  });

  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    if (currentCompany) {
      localStorage.setItem("companyId", currentCompany.id);
    } else {
      localStorage.removeItem("companyId");
    }
  }, [currentCompany]);

  return (
    <CompanyContext.Provider
      value={{ currentCompany, setCurrentCompany, companies, setCompanies }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
