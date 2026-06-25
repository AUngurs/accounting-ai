import React from "react";

const ROW_HEIGHT = 24;

export default function FinancialDocsTableBody({
  partnerMap,
  selectedDocs,
  setSelectedDocs,
  scrollTop,
  handleEditClick,
  sortedDocs,
  visibleRowsCount,
}) {
  const totalRows = sortedDocs.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT));
  const endIndex = Math.min(totalRows, startIndex + visibleRowsCount);
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = (totalRows - endIndex) * ROW_HEIGHT;

  const visibleRows = [];

  for (let i = startIndex; i < endIndex; i++) {
    const doc = sortedDocs[i];

    visibleRows.push(
      <tr key={doc.id} className="align-middle" style={{ cursor: "pointer" }} onClick={() => handleEditClick(doc)}>
        <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="form-check-input"
            checked={selectedDocs.has(doc.id)}
            onChange={(e) => {
              const newSet = new Set(selectedDocs);
              e.target.checked ? newSet.add(doc.id) : newSet.delete(doc.id);
              setSelectedDocs(newSet);
            }}
          />
        </td>
        <td>{doc.doc_date}</td>
        <td>{doc.doc_id}</td>
        <td>{partnerMap[doc.partner_id] || ""}</td>
        <td>{doc.doc_type_abbrev}</td>
        <td>{doc.doc_currency}</td>
        <td className={doc.is_accounted ? "amount-accounted" : "amount-unaccounted"}>
          {doc.doc_amount}
        </td>
        <td>{doc.doc_comments}</td>
        <td></td>
      </tr>
    );
  }

  return (
    <React.Fragment>
      <tbody>
        <tr>
          <td colSpan={9} style={{ height: paddingTop, padding: 0, border: 0 }} />
        </tr>
        {visibleRows}
        <tr>
          <td colSpan={9} style={{ height: paddingBottom, padding: 0, border: 0 }} />
        </tr>
      </tbody>
    </React.Fragment>
  );
}
