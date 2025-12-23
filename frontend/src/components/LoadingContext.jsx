import React, { createContext, useState, useContext } from "react";
import { Spinner } from "react-bootstrap";

// Izveido Loading kontekstu, lai nodrošinātu globālu ielādes stāvokļa pārvaldību
const LoadingContext = createContext();

// Custom hook, kas ļauj komponentiem piekļūt Loading konteksta vērtībai
export const useLoading = () => useContext(LoadingContext);

// LoadingProvider nodrošina stāvokļa pārvaldību un spinner vizuālo attēlošanu
export const LoadingProvider = ({ children }) => {
  // Stāvoklis, kas norāda, vai notiek ielāde
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
      {/* Ja loading ir true, tiek attēlots overlay ar spinner */}
      {loading && (
        <div style={overlayStyle}>
          <Spinner
            animation="border"
            role="status"
            style={{ width: "4rem", height: "4rem" }} // Palielina spinner izmēru
          />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

// CSS stils overlay, kas pārklāj visu ekrānu un centrē spinner
const overlayStyle = {
  position: "fixed", // Fiksē overlay virs visa satura
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.4)", // Puscaurspīdīgs fons
  display: "flex",
  justifyContent: "center", // Horizontāli centrē spinner
  alignItems: "center", // Vertikāli centrē spinner
  zIndex: 9999, // Nodrošina, ka overlay ir virs citiem elementiem
  pointerEvents: "all", // Novērš klikšķu caurlaidību
};
