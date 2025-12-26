import React from "react";
import { Collapse } from "react-bootstrap";
import DocumentLines from "./DocumentLines";

// Fiksēta rindas augstuma konstante, kas nepieciešama virtualizācijai
const ROW_HEIGHT = 24;

// Komponente, kas renderē dokumentu tabulas ķermeni ar virtualizāciju un paplašināmu rindu
export default function FinancialDocsTableBody({
  partnerMap, // Map no partnera ID uz nosaukumu
  openDocId, // ID dokumentam, kas šobrīd ir atvērts (Collapse)
  setOpenDocId, // Funkcija, lai mainītu atvērtā dokumenta ID
  selectedDocs, // Set ar izvēlētajiem dokumentu ID
  setSelectedDocs, // Funkcija, lai atjauninātu izvēlēto dokumentu Set
  scrollTop, // Scroll pozīcija tabulai
  companyId, // Uzņēmuma ID, nepieciešams DocumentLines
  handleEditClick, // Callback rediģēšanas pogai
  sortedDocs, // Sakārtoto dokumentu masīvs
  handleUpdateAccounted, // Callback, lai atjauninātu is_accounted statusu
  visibleRowsCount, // Cik redzamas rindas vienlaikus (virtualizācijai)
}) {
  // Aprēķina kopējo rindu skaitu tabulā (katrs dokuments aizņem 2 rindas: galveno + Collapse)
  const totalRows = sortedDocs.length * 2;

  // Aprēķina sākuma un beigu indeksu redzamo rindu virtualizācijai
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT));
  const endIndex = Math.min(totalRows, startIndex + visibleRowsCount * 2);

  // Aprēķina padding augšai un apakšai, lai saglabātu scroll bar
  const paddingTop = startIndex * ROW_HEIGHT;
  const paddingBottom = (totalRows - endIndex) * ROW_HEIGHT;

  const visibleRows = [];

  // Iterē pa redzamajām rindām (pa divām rindām uz katru dokumentu)
  for (let i = startIndex; i < endIndex; i += 2) {
    const doc = sortedDocs[Math.floor(i / 2)]; // Dabū dokumentu
    const isOpen = openDocId === doc.id; // Pārbauda, vai Collapse jāatver

    visibleRows.push(
      <React.Fragment key={doc.id}>
        {/* Galvenā rinda */}
        <tr
          onClick={() => setOpenDocId(isOpen ? null : doc.id)}
          style={{ cursor: "pointer" }}
        >
          {/* Checkbox izvēlei */}
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
              onClick={(e) => e.stopPropagation()} // Neļauj checkbox clickam triggerēt rindu click
            />
          </td>
          <td>{doc.doc_date}</td>
          <td>{doc.doc_id}</td>
          <td>{partnerMap[doc.partner_id] || ""}</td>
          <td>{doc.doc_type_abbrev}</td>
          <td>{doc.doc_currency}</td>
          {/* Summa ar fona krāsu atkarībā no is_accounted */}
          <td
            style={{
              textAlign: "right",
              backgroundColor: doc.is_accounted ? "#d4edda" : "#f8d7da",
            }}
          >
            {doc.doc_amount}
          </td>
          <td>{doc.doc_comments}</td>
          <td>
            <div className="d-flex justify-content-evenly">
              {/* Rediģēšanas poga */}
              <button
                className="btn btn-sm custom-dark-hover"
                style={{
                  padding: "0.15rem 0.25rem",
                  fontSize: "0.85rem",
                  lineHeight: 1,
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Neļauj triggerēt rindu click
                  handleEditClick(doc);
                }}
              >
                <i className="bi bi-pencil-square" />
              </button>
            </div>
          </td>
        </tr>

        {/* Paplašināmā rinda ar DocumentLines komponenti */}
        <tr>
          <td colSpan={9} style={{ padding: 0, border: 0 }}>
            <Collapse in={isOpen}>
              <div>
                <DocumentLines
                  companyId={companyId}
                  documentId={doc.id}
                  onUpdateAccounted={handleUpdateAccounted}
                />
              </div>
            </Collapse>
          </td>
        </tr>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {/* Colgroup definē kolonnu platumus */}
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

      {/* tbody ar padding rindām virtualizācijai */}
      <tbody>
        <tr style={{ height: paddingTop }} /> {/* Top padding */}
        {visibleRows} {/* Redzamās rindas */}
        <tr style={{ height: paddingBottom }} /> {/* Bottom padding */}
      </tbody>
    </React.Fragment>
  );
}
