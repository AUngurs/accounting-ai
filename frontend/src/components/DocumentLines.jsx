import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { Table, Collapse, Card } from "react-bootstrap";

export default function DocumentLines({ companyId, documentId, onUpdateAccounted }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLines, setEditedLines] = useState([]);

  const lineCurrencyOptions = ["DKK", "EUR", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];

  // Fetch accounts
  useEffect(() => {
    axiosInstance
      .get(`/companies/${companyId}/accounts`)
      .then((res) => setAccounts(res.data))
      .catch((err) => console.error(err));
  }, [companyId]);

  // Fetch lines
  useEffect(() => {
    if (!documentId) return;

    setLoading(true);
    axiosInstance
      .get(`/companies/${companyId}/documents/${documentId}/lines`)
      .then((res) => setLines(res.data))
      .catch((err) => {
        console.error(err);
        setError("Neizdevās ielādēt kontējumu rindiņas.");
      })
      .finally(() => setLoading(false));
  }, [companyId, documentId]);

  function updateLine(index, field, value) {
    setEditedLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  const handleSave = async () => {
    try {
      await axiosInstance.put(`/companies/${companyId}/documents/${documentId}/lines`, editedLines);

      const totalCents = editedLines
        .filter((l) => l.line_supplementary_notice === "1")
        .reduce((sum, l) => sum + Math.round(Number(l.line_amount || 0) * 100), 0);

      const { data: docs } = await axiosInstance.get(`/companies/${companyId}/documents/${documentId}`);
      const doc = docs[0];
      const docAmountCents = Math.round(Number(doc.doc_amount) * 100);
      const is_accounted = totalCents === docAmountCents;

      const { data: updatedDoc } = await axiosInstance.put(`/companies/${companyId}/documents/${documentId}/accounted`, { is_accounted });

      if (onUpdateAccounted) onUpdateAccounted(updatedDoc);

      setLines([...editedLines]);
      setIsEditing(false);
      setEditedLines([]);
    } catch (err) {
      console.error(err);
      alert("Neizdevās saglabāt izmaiņas.");
    }
  };

  if (loading) return <div>Notiek ielāde...</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (lines.length === 0) return <div>Nav kontējumu rindiņu.</div>;

  const displayLines = isEditing ? editedLines : lines;

  return (
    <Collapse in={true}>
      <Card.Body className="p-2">
        <Table hover size="sm" className="mb-0">
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "7%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "50%" }} />
            <col style={{ width: "38px" }} />
          </colgroup>
          <thead className="table-light">
            <tr>
              <th className="text-center">#</th>
              <th>Valūta</th>
              <th>Summa</th>
              <th>Debets</th>
              <th>Kredīts</th>
              <th>PVN</th>
              <th>Kontējuma piezīmes</th>
              <th className="text-center">
                {!isEditing ? (
                  <div className="d-flex justify-content-evenly">
                    <button
                      className="btn p-0 border-0"
                      onClick={() => {
                        setIsEditing(true);
                        setEditedLines([...lines]);
                      }}
                    >
                      <i className="bi bi-pencil-square" style={{ color: "white" }}></i>
                    </button>
                  </div>
                ) : (
                  <div className="d-flex justify-content-evenly">
                    <button className="btn p-0 border-0" onClick={handleSave}>
                      <i className="bi bi-check-square" style={{ color: "white" }}></i>
                    </button>
                  </div>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayLines.map((line, index) => (
              <tr key={line.id} className="align-middle">
                <td className="text-center">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={line.line_supplementary_notice === "1"}
                    onChange={(e) => (isEditing ? updateLine(index, "line_supplementary_notice", e.target.checked ? "1" : "0") : null)}
                    readOnly={!isEditing}
                  />
                </td>
                <td>
                  {isEditing ? (
                    <select
                      className="form-select form-select-sm"
                      value={line.line_currency}
                      onChange={(e) => updateLine(index, "line_currency", e.target.value)}
                    >
                      {lineCurrencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    line.line_currency
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={line.line_amount}
                      onChange={(e) => updateLine(index, "line_amount", e.target.value)}
                      className="form-control form-control-sm"
                    />
                  ) : (
                    line.line_amount
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      className="form-select form-select-sm"
                      value={line.line_debet_account || ""}
                      onChange={(e) => updateLine(index, "line_debet_account", e.target.value)}
                    >
                      <option value="">--</option>
                      {accounts.map((acc) => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    line.line_debet_account
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <select
                      className="form-select form-select-sm"
                      value={line.line_credit_account || ""}
                      onChange={(e) => updateLine(index, "line_credit_account", e.target.value)}
                    >
                      <option value="">--</option>
                      {accounts.map((acc) => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    line.line_credit_account
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={line.line_vat_rate || ""}
                      onChange={(e) => updateLine(index, "line_vat_rate", e.target.value)}
                      className="form-control form-control-sm"
                    />
                  ) : line.line_vat_rate ? (
                    `${line.line_vat_rate}%`
                  ) : (
                    ""
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={line.line_comments || ""}
                      onChange={(e) => updateLine(index, "line_comments", e.target.value)}
                      className="form-control form-control-sm"
                    />
                  ) : (
                    line.line_comments
                  )}
                </td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Collapse>
  );
}
