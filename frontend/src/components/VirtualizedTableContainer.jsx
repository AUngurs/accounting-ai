import React, { useEffect, useRef } from "react";

// VirtualizedTableContainer komponente nodrošina virtuālu tabulas rindu attēlošanu
// Aprēķina, cik rindu var redzēt vienlaikus, un nodrošina scroll stāvokļa izsekošanu
export default function VirtualizedTableContainer({ rowHeight, offsetPx, onScrollChange, onVisibleRowsChange, children, className = "" }) {
  const containerRef = useRef(null); // Ref uz container div, lai iegūtu tā izmērus

  useEffect(() => {
    if (!containerRef.current) return;

    // Funkcija aprēķina redzamo rindu skaitu, balstoties uz container augstumu un rowHeight
    const update = () => {
      const height = containerRef.current.clientHeight;
      onVisibleRowsChange(Math.ceil(height / rowHeight));
    };

    update(); // Izsauc sākotnējai aprēķināšanai

    // ResizeObserver izsauc update, ja container izmērs mainās
    const observer = new ResizeObserver(update);
    observer.observe(containerRef.current);

    return () => observer.disconnect(); // Atvieno observer, kad komponente tiek noņemta
  }, [rowHeight, onVisibleRowsChange]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: `calc(100vh - ${offsetPx}px)`, // Dinamiski iestata augstumu, ņemot vērā offset (piem., header augstumu)
        overflowY: "auto", // Nodrošina vertikālo scroll
      }}
      onScroll={(e) => onScrollChange(e.target.scrollTop)} // Izsauc callback ar scrollTop pozīciju
    >
      {children} {/* Attēlo tabulas rindas */}
    </div>
  );
}
