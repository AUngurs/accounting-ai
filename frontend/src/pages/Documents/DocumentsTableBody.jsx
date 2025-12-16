import React from "react";
import { Collapse } from "react-bootstrap";
import DocumentLines from "../../components/DocumentLines";

const ROW_HEIGHT = 24;

export default function FinancialDocsTableBody({
  partnerMap,
  openDocId,
  setOpenDocId,
  selectedDocs,
  setSelectedDocs,
  scrollTop,
  companyId,
  handleEditClick,
  sortedDocs,
  handleUpdateAccounted,
  visibleRowsCount,
}) {
  const totalRows = sortedDocs.length * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT));
  const endIndex = Math.min(totalRows, startIndex + visibleRowsCount * 2);
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = (totalRows - endIndex) * ROW_HEIGHT;

  const visibleRows = [];
  for (let i = startIndex; i < endIndex; i += 2) {
    const doc = sortedDocs[Math.floor(i / 2)];
    const isOpen = openDocId === doc.id;

    visibleRows.push(
      <React.Fragment key={doc.id}>
        <tr onClick={() => setOpenDocId(isOpen ? null : doc.id)} style={{ cursor: "pointer" }}>
          <td style={{ textAlign: "center" }}>
            <input
              type="checkbox"
              className="form-check-input"
              checked={selectedDocs.has(doc.id)}
              onChange={(e) => {
                const newSet = new Set(selectedDocs);
                e.target.checked ? newSet.add(doc.id) : newSet.delete(doc.id);
                setSelectedDocs(newSet);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </td>
          <td>{doc.doc_date}</td>
          <td>{doc.doc_id}</td>
          <td>{partnerMap[doc.partner_id] || ""}</td>
          <td>{doc.doc_type_abbrev}</td>
          <td>{doc.doc_currency}</td>
          <td style={{ backgroundColor: doc.is_accounted ? "#d4edda" : "#f8d7da" }}>{doc.doc_amount}</td>
          <td>{doc.doc_comments}</td>
          <td>
            <div className="d-flex justify-content-evenly">
              <button
                className="btn btn-sm custom-dark-hover"
                style={{ padding: "0.15rem 0.25rem", fontSize: "0.85rem", lineHeight: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(doc);
                }}
              >
                <i className="bi bi-pencil-square"></i>
              </button>
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan={9} style={{ padding: 0, border: 0 }}>
            <Collapse in={isOpen}>
              <div>
                <DocumentLines companyId={companyId} documentId={doc.id} onUpdateAccounted={handleUpdateAccounted} />
              </div>
            </Collapse>
          </td>
        </tr>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <colgroup>
        <col style={{ width: "3%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "21%" }} />
        <col style={{ width: "7%" }} />
        <col style={{ width: "5%" }} />
        <col style={{ width: "8%" }} />
        <col style={{ width: "36%" }} />
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
