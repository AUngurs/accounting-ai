import React from "react";
import { Table, Column, AutoSizer } from "react-virtualized";

export default function VirtualizedPartners({ partners, togglePartnerSelection, selectedPartners, handleEditClick }) {
  return (
    <div style={{ height: 500 }}>
      {" "}
      {/* Fixed height for scrolling */}
      <AutoSizer>
        {({ width, height }) => (
          <Table
            width={width}
            height={height}
            headerHeight={40}
            rowHeight={40}
            rowCount={partners.length}
            rowGetter={({ index }) => partners[index]}
          >
            <Column
              label=""
              dataKey="id"
              width={40}
              cellRenderer={({ rowData }) => (
                <input
                  type="checkbox"
                  checked={selectedPartners.has(rowData.id)}
                  onChange={(e) => togglePartnerSelection(rowData.id, e.target.checked)}
                />
              )}
            />
            <Column label="Nosaukums/Uzvārds" dataKey="partner_name" width={200} />
            <Column label="Tips" dataKey="partner_kind_name" width={100} />
            <Column label="Reģ. Nr." dataKey="partner_reg_nr" width={150} />
            <Column label="PVN Nr." dataKey="vat_nr" width={150} />
            <Column
              label=""
              dataKey="actions"
              width={50}
              cellRenderer={({ rowData }) => (
                <button className="btn p-0 border-0" onClick={() => handleEditClick(rowData)}>
                  <i className="bi bi-pencil-square"></i>
                </button>
              )}
            />
          </Table>
        )}
      </AutoSizer>
    </div>
  );
}
