import React, { createContext, useState, useContext, useEffect, useCallback } from "react";

const CompanyContext = createContext();

export function useCompany() {
  return useContext(CompanyContext);
}

export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const savedCompanies = localStorage.getItem("companies");
    const savedId = localStorage.getItem("companyId");
    const savedCompany = localStorage.getItem("company");

    if (savedId) setCompanyId(savedId);
    if (savedCompany) setCompany(JSON.parse(savedCompany));
    if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
  }, []);

  useEffect(() => {
    if (companies?.length > 0) localStorage.setItem("companies", JSON.stringify(companies));
    else localStorage.removeItem("companies");
  }, [companies]);

  useEffect(() => {
    if (companyId) localStorage.setItem("companyId", companyId);
    else localStorage.removeItem("companyId");
  }, [companyId]);

  useEffect(() => {
    if (company) localStorage.setItem("company", JSON.stringify(company));
    else localStorage.removeItem("company");
  }, [company]);

  const updateCompanies = useCallback(
    (companyList) => {
      setCompanies(companyList);

      if (companyId && !companyList.some((c) => c.id === companyId)) {
        setCompanyId(null);
        setCompany(null);
      }
    },
    [companyId]
  );

  const selectCompany = (id, companyData = null) => {
    setCompanyId(id);

    if (companyData) {
      setCompany(companyData);
    } else {
      const found = companies.find((c) => c.id === id);
      if (found) setCompany(found);
    }
  };

  const clearCompany = () => {
    localStorage.removeItem("companyId");
    localStorage.removeItem("company");
    setCompanyId(null);
    setCompany(null);
  };

  const clearAll = () => {
    localStorage.removeItem("companies");
    localStorage.removeItem("companyId");
    localStorage.removeItem("company");

    setCompanies([]);
    setCompanyId(null);
    setCompany(null);
  };

  const value = {
    companies,
    companyId,
    company,
    updateCompanies,
    selectCompany,
    clearCompany,
    clearAll,
    setCompanies,
    setCompanyId,
    setCompany,
    hasCompany: !!companyId,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
