import React from "react";

export default function PartnersTableBody({
  filteredPartners,
  scrollTop,
  ROW_HEIGHT,
  VISIBLE_ROWS,
  selectedPartners,
  setSelectedPartners,
  handleEditClick,
}) {
  const totalRows = filteredPartners.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT));
  const endIndex = Math.min(totalRows, startIndex + VISIBLE_ROWS);
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = (totalRows - endIndex) * ROW_HEIGHT;

  const visibleRows = [];
  for (let i = startIndex; i < endIndex; i++) {
    const partner = filteredPartners[i];
    console.log("FOR LOOP STARTED");
    visibleRows.push(
      <React.Fragment key={partner.id}>
        <tr style={{ cursor: "pointer" }}>
          <td style={{ textAlign: "center" }}>
            <input
              type="checkbox"
              className="form-check-input"
              checked={selectedPartners.has(partner.id)}
              onChange={(e) => {
                const newSet = new Set(selectedPartners);
                e.target.checked ? newSet.add(partner.id) : newSet.delete(partner.id);
                setSelectedPartners(newSet);
              }}
              onClick={(e) => e.stopPropagation()}
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
          <td>
            <div className="d-flex justify-content-evenly">
              <button
                className="btn btn-sm custom-dark-hover"
                style={{ padding: "0.15rem 0.25rem", fontSize: "0.85rem", lineHeight: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(partner);
                }}
              >
                <i className="bi bi-pencil-square"></i>
              </button>
            </div>
          </td>
        </tr>
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      <colgroup>
        <col style={{ width: "3%" }} />
        <col style={{ width: "44%" }} />
        <col style={{ width: "13%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "20%" }} />
        <col style={{ width: "38px" }} />
      </colgroup>
      <tbody>
        <tr style={{ height: paddingTop }} />
        {visibleRows}
        <tr style={{ height: paddingBottom }} />
      </tbody>
    </React.Fragment>
  );
}
