import React, { createContext, useState, useContext } from "react";
import { Spinner } from "react-bootstrap";

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
      {loading && (
        <div style={overlayStyle}>
          <Spinner animation="border" role="status" style={{ width: "4rem", height: "4rem" }} />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  pointerEvents: "all",
};
