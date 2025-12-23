import { createContext, useContext, useEffect, useState } from "react";

// Izveido Auth kontekstu, lai dalītos ar autentifikācijas datiem visā aplikācijā
const AuthContext = createContext();

// Custom hook, kas ļauj komponentiem piekļūt Auth konteksta vērtībai
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Stāvoklis, kas norāda, vai autentifikācijas dati tiek ielādēti
  const [loading, setLoading] = useState(true);

  // Stāvoklis JWT tokenam un lietotāja datiem
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // useEffect ielādē saglabātos tokenu un lietotāja datus no localStorage pirmās renderēšanas laikā
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) setToken(savedToken); // Iestata tokenu, ja tas pastāv
    if (savedUser) setUser(JSON.parse(savedUser)); // Iestata lietotāja datus, ja tie pastāv

    setLoading(false); // Marķē, ka ielāde pabeigta
  }, []);

  // useEffect sinhronizē token stāvokli ar localStorage, lai tas vienmēr atbilstu
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token"); // Noņem token, ja tas tiek dzēsts
  }, [token]);

  // useEffect sinhronizē lietotāja datus ar localStorage
  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user"); // Noņem lietotāja datus, ja tie tiek dzēsti
  }, [user]);

  // Funkcija, kas veic login: iestata tokenu un lietotāja datus
  const login = (newToken, userData = null) => {
    setToken(newToken);
    if (userData) setUser(userData);
  };

  // Funkcija, kas veic logout: izdzēš tokenu un lietotāja datus gan stāvoklī, gan localStorage
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Konteksta vērtība, kas tiek nodota visiem bērnu komponentiem
  const value = {
    token,
    user,
    login,
    logout,
    setToken,
    setUser,
    isAuthenticated: !!token, // Boolean, kas norāda, vai lietotājs ir autentificēts
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; // Nodrošina konteksta vērtību visiem bērniem
}
