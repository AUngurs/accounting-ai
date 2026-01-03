import { createContext, useState, useContext, useEffect, useCallback } from "react";

// Izveido Company kontekstu, lai dalītos ar uzņēmumu datiem visā aplikācijā
const CompanyContext = createContext();

// Custom hook, kas ļauj komponentiem piekļūt Company konteksta vērtībai
export function useCompany() {
  return useContext(CompanyContext);
}

export function CompanyProvider({ children }) {
  // Stāvokļi uzņēmumu sarakstam, izvēlētajam uzņēmuma ID un uzņēmuma datiem
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [company, setCompany] = useState(null);

  // useEffect ielādē saglabātos datus no localStorage pirmās renderēšanas laikā
  useEffect(() => {
    const savedCompanies = localStorage.getItem("companies");
    const savedId = localStorage.getItem("companyId");
    const savedCompany = localStorage.getItem("company");

    if (savedId) setCompanyId(savedId);
    if (savedCompany) setCompany(JSON.parse(savedCompany));
    if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
  }, []);

  // Sinhronizē companies stāvokli ar localStorage
  useEffect(() => {
    if (companies?.length > 0) localStorage.setItem("companies", JSON.stringify(companies));
    else localStorage.removeItem("companies"); // Noņem, ja saraksts ir tukšs
  }, [companies]);

  // Sinhronizē companyId stāvokli ar localStorage
  useEffect(() => {
    if (companyId) localStorage.setItem("companyId", companyId);
    else localStorage.removeItem("companyId");
  }, [companyId]);

  // Sinhronizē izvēlētā uzņēmuma datus ar localStorage
  useEffect(() => {
    if (company) localStorage.setItem("company", JSON.stringify(company));
    else localStorage.removeItem("company");
  }, [company]);

  // Funkcija, kas atjaunina uzņēmumu sarakstu un dzēš izvēlēto uzņēmumu, ja tas vairs nav sarakstā
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

  // Funkcija izvēlētā uzņēmuma iestatīšanai pēc ID vai datiem
  const selectCompany = (id, companyData = null) => {
    setCompanyId(id);

    if (companyData) {
      setCompany(companyData);
    } else {
      const found = companies.find((c) => c.id === id);
      if (found) setCompany(found);
    }
  };

  // Funkcija izvēlētā uzņēmuma dzēšanai
  const clearCompany = () => {
    localStorage.removeItem("companyId");
    localStorage.removeItem("company");
    setCompanyId(null);
    setCompany(null);
  };

  // Funkcija visiem uzņēmumiem un izvēlētajam uzņēmumam stāvokļa un localStorage dzēšanai
  const clearAll = () => {
    localStorage.removeItem("companies");
    localStorage.removeItem("companyId");
    localStorage.removeItem("company");

    setCompanies([]);
    setCompanyId(null);
    setCompany(null);
  };

  // Konteksta vērtība, kas nodrošina piekļuvi visiem stāvokļiem un funkcijām
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
    hasCompany: !!companyId, // Boolean, kas norāda, vai ir izvēlēts uzņēmums
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>; // Nodrošina konteksta vērtību visiem bērniem
}
