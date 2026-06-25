import React from "react";

const ROW_HEIGHT = 24; // Augstums vienai rindai virtualizētajā tabulā

export default function PartnersTableBody({
  sortedPartners,
  scrollTop,
  selectedPartners,
  setSelectedPartners,
  handleEditClick,
  visibleRowsCount,
}) {
  const totalRows = sortedPartners.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT)); // Pirmā redzamā rinda
  const endIndex = Math.min(totalRows, startIndex + visibleRowsCount); // Pēdējā redzamā rinda
  const paddingTop = startIndex * ROW_HEIGHT; // Augšējā padding vieta
  const paddingBottom = (totalRows - endIndex) * ROW_HEIGHT; // Apakšējā padding vieta

  const visibleRows = [];
  for (let i = startIndex; i < endIndex; i++) {
    const partner = sortedPartners[i];
    visibleRows.push(
      <tr key={partner.id} style={{ cursor: "pointer" }} onClick={() => handleEditClick(partner)}>
        <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="form-check-input"
            checked={selectedPartners.has(partner.id)}
            onChange={(e) => {
              const newSet = new Set(selectedPartners);
              e.target.checked ? newSet.add(partner.id) : newSet.delete(partner.id);
              setSelectedPartners(newSet);
            }}
          />
        </td>
        <td>
          {partner.partner_kind_name === "Juridiska persona"
            ? `${partner.partner_name}${partner.partner_title ? ", " + partner.partner_title : ""}`
            : `${partner.partner_title} ${partner.partner_name}`}
        </td>
        <td>{partner.partner_kind_name}</td>
        <td>{partner.partner_reg_nr}</td>
        <td>{partner.vat_nr}</td>
        <td></td>
      </tr>
    );
  }

  return (
    <React.Fragment>
      <tbody>
        {/* Augšējais padding */}
        <tr style={{ height: paddingTop }} />
        {/* Redzamās rindas */}
        {visibleRows}
        {/* Apakšējais padding */}
        <tr style={{ height: paddingBottom }} />
      </tbody>
    </React.Fragment>
  );
}
