import React, { useEffect, useRef } from "react";

export default function VirtualizedTableContainer({ rowHeight, offsetPx, onScrollChange, onVisibleRowsChange, children, className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const update = () => {
      const height = containerRef.current.clientHeight;
      onVisibleRowsChange(Math.ceil(height / rowHeight));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [rowHeight, onVisibleRowsChange]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: `calc(100vh - ${offsetPx}px)`,
        overflowY: "auto",
      }}
      onScroll={(e) => onScrollChange(e.target.scrollTop)}
    >
      {children}
    </div>
  );
}
