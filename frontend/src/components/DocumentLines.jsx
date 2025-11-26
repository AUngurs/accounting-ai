import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

export default function DocumentLines({ companyId, documentId }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLines, setEditedLines] = useState([]);

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
      setLines([...editedLines]); // <-- correct state update
      setIsEditing(false); // <-- exit editing mode
      setEditedLines([]); // <-- clear editing buffer
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
    <React.Fragment>
      <div className="d-flex justify-content-end mb-2">
        {!isEditing ? (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setIsEditing(true);
              setEditedLines(JSON.parse(JSON.stringify(lines)));
            }}
          >
            Edit
          </button>
        ) : (
          <>
            <button
              className="btn btn-secondary btn-sm me-2"
              onClick={() => {
                setIsEditing(false);
                setEditedLines([]);
              }}
            >
              Cancel
            </button>
            <button className="btn btn-success btn-sm" onClick={handleSave}>
              Save
            </button>
          </>
        )}
      </div>

      <table className="table table-sm table-bordered mt-2">
        <thead className="table-light">
          <tr>
            <th style={{ width: "3%" }}></th>
            <th style={{ width: "7%" }}>Valūta</th>
            <th style={{ width: "10%" }}>Summa</th>
            <th style={{ width: "12%" }}>Debets</th>
            <th style={{ width: "12%" }}>Kredīts</th>
            <th style={{ width: "6%" }}>PVN</th>
            <th>Kontējuma piezīmes</th>
          </tr>
        </thead>
        <tbody>
          {displayLines.map((line, index) => (
            <tr key={line.id}>
              <td style={{ textAlign: "center" }}>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={line.line_supplementary_notice === "1"}
                    onChange={(e) => updateLine(index, "line_supplementary_notice", e.target.checked ? "1" : "0")}
                  />
                ) : (
                  <input type="checkbox" checked={line.line_supplementary_notice === "1"} readOnly />
                )}
              </td>

              <td>
                {isEditing ? (
                  <input
                    type="text"
                    value={line.line_currency}
                    onChange={(e) => updateLine(index, "line_currency", e.target.value)}
                    className="form-control form-control-sm"
                  />
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
                    type="text"
                    value={line.line_vat_rate}
                    onChange={(e) => updateLine(index, "line_vat_rate", e.target.value)}
                    className="form-control form-control-sm"
                  />
                ) : (
                  line.line_vat_rate
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
            </tr>
          ))}
        </tbody>
      </table>
    </React.Fragment>
  );
}
