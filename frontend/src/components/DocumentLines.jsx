import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { Table, Collapse, Card, Form, Button } from "react-bootstrap";
import { documentLineRules } from "../utils/validators";
import AmountInput from "./AmountInput";

export default function DocumentLines({ companyId, documentId, onUpdateAccounted }) {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLines, setEditedLines] = useState([]);
  const [placeholderActive, setPlaceholderActive] = useState(false);
  const [newLineDraft, setNewLineDraft] = useState({
    id: null,
    line_currency: "EUR",
    line_amount: "0.00",
    line_debet_account: "",
    line_credit_account: "",
    line_vat_rate: "",
    line_comments: "",
    line_supplementary_notice: "1",
  });
  const [lineErrors, setLineErrors] = useState({});

  const lineCurrencyOptions = ["EUR", "DKK", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];

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

  function deleteLine(index) {
    setEditedLines((prev) => prev.filter((_, i) => i !== index));
  }

  const handleSave = async () => {
    try {
      const errors = {};
      editedLines.forEach((line) => {
        const lineErrors = documentLineRules(line);
        if (Object.keys(lineErrors).length > 0) {
          errors[line.id || line.tempId] = lineErrors;
        }
      });

      if (Object.keys(errors).length > 0) {
        setLineErrors(errors);
        return;
      }

      const defaultAccount = accounts.length > 0 ? accounts[0].code : "11";

      const linesToSave = editedLines.map((line) => ({
        ...line,
        line_debet_account: line.line_debet_account || defaultAccount,
        line_credit_account: line.line_credit_account || defaultAccount,
        line_vat_rate: line.line_vat_rate ? Number(line.line_vat_rate) : null,
      }));

      const deletedLineIds = lines.filter((line) => !linesToSave.find((l) => l.id === line.id)).map((l) => l.id);
      const updatedLines = linesToSave.filter((l) => l.id && !l.id.toString().startsWith("new-"));
      const newLines = linesToSave.filter((l) => !l.id || l.id.toString().startsWith("new-"));

      const payload = {
        updated: updatedLines,
        inserted: newLines,
        deleted: deletedLineIds,
      };

      const { data } = await axiosInstance.put(`/companies/${companyId}/documents/${documentId}/lines`, payload);

      const allLines = data.allLines;

      const totalCents = allLines
        .filter((l) => l.line_supplementary_notice === "1")
        .reduce((sum, l) => sum + Math.round(Number(l.line_amount || 0) * 100), 0);
      const { data: docs } = await axiosInstance.get(`/companies/${companyId}/documents/${documentId}`);
      const doc = docs[0];
      const docAmountCents = Math.round(Number(doc.doc_amount) * 100);
      const is_accounted = totalCents === docAmountCents;

      const { data: updatedDoc } = await axiosInstance.put(`/companies/${companyId}/documents/${documentId}/accounted`, { is_accounted });

      if (onUpdateAccounted) onUpdateAccounted(updatedDoc);

      setLines(allLines);
      setIsEditing(false);
      setEditedLines([]);
    } catch (err) {
      console.error(err);
      alert("Neizdevās saglabāt izmaiņas.");
    }
  };

  if (loading) return <div>Notiek ielāde...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  const displayLines = isEditing ? editedLines : lines;

  return (
    <Collapse in={true}>
      <Card.Body className="p-2">
        <Form>
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
                <th className="text-center">
                  {!isEditing ? (
                    <div className="d-flex justify-content-evenly">
                      <Button
                        className="custom-light-hover"
                        style={{ padding: "0.15rem 0.25rem", fontSize: "0.85rem", lineHeight: 1 }}
                        onClick={() => {
                          setIsEditing(true);
                          setLineErrors({});
                          setEditedLines(
                            lines.map((line) => ({
                              ...line,
                              line_debet_account: line.line_debet_account ? line.line_debet_account.toString() : "",
                              line_credit_account: line.line_credit_account ? line.line_credit_account.toString() : "",
                              line_currency: line.line_currency || "EUR",
                              line_amount: line.line_amount,
                              line_vat_rate: line.line_vat_rate || null,
                              line_comments: line.line_comments || "",
                              line_supplementary_notice: line.line_supplementary_notice || "0",
                            }))
                          );
                        }}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-evenly">
                      <Button
                        className="custom-light-hover"
                        style={{ padding: "0.15rem 0.25rem", fontSize: "0.85rem", lineHeight: 1 }}
                        onClick={handleSave}
                      >
                        <i className="bi bi-check-square"></i>
                      </Button>
                    </div>
                  )}
                </th>
                <th>Valūta</th>
                <th>Summa</th>
                <th>Debets</th>
                <th>Kredīts</th>
                <th>PVN</th>
                <th>Kontējuma piezīmes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayLines.map((line, index) => (
                <tr key={line.id || `placeholder-${index}`} className="align-middle">
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
                      <React.Fragment>
                        <Form.Select
                          size="sm"
                          value={line.line_currency}
                          onChange={(e) => updateLine(index, "line_currency", e.target.value)}
                          isInvalid={!!lineErrors[line.id]?.line_currency}
                        >
                          {lineCurrencyOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_currency}</Form.Control.Feedback>
                      </React.Fragment>
                    ) : (
                      line.line_currency
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <React.Fragment>
                        <AmountInput
                          size="sm"
                          value={line.line_amount}
                          onChange={(val) => updateLine(index, "line_amount", val)}
                          isInvalid={!!lineErrors[line.id]?.line_amount}
                        />
                        <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_amount}</Form.Control.Feedback>
                      </React.Fragment>
                    ) : (
                      line.line_amount
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <React.Fragment>
                        <Form.Select
                          size="sm"
                          value={line.line_debet_account || ""}
                          onChange={(e) => updateLine(index, "line_debet_account", e.target.value)}
                          isInvalid={!!lineErrors[line.id]?.line_debet_account}
                        >
                          {accounts.map((acc) => (
                            <option key={acc.code} value={acc.code.toString()}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_debet_account}</Form.Control.Feedback>
                      </React.Fragment>
                    ) : (
                      line.line_debet_account
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <React.Fragment>
                        <Form.Select
                          size="sm"
                          value={line.line_credit_account || ""}
                          onChange={(e) => updateLine(index, "line_credit_account", e.target.value)}
                          isInvalid={!!lineErrors[line.id]?.line_credit_account}
                        >
                          {accounts.map((acc) => (
                            <option key={acc.code} value={acc.code.toString()}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_credit_account}</Form.Control.Feedback>
                      </React.Fragment>
                    ) : (
                      line.line_credit_account
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <React.Fragment>
                        <Form.Control
                          size="sm"
                          type="number"
                          min="0"
                          value={line.line_vat_rate || ""}
                          onChange={(e) => updateLine(index, "line_vat_rate", e.target.value)}
                          isInvalid={!!lineErrors[line.id]?.line_vat_rate}
                        />
                        <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_vat_rate}</Form.Control.Feedback>
                      </React.Fragment>
                    ) : line.line_vat_rate ? (
                      `${line.line_vat_rate}%`
                    ) : (
                      ""
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <React.Fragment>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={line.line_comments || ""}
                          onChange={(e) => updateLine(index, "line_comments", e.target.value)}
                          isInvalid={!!lineErrors[line.id]?.line_comments}
                        />
                        <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_comments}</Form.Control.Feedback>
                      </React.Fragment>
                    ) : (
                      line.line_comments
                    )}
                  </td>

                  <td>
                    {isEditing && (
                      <Button size="sm" className="custom-red-hover" onClick={() => deleteLine(index)}>
                        <i className="bi bi-x-lg"></i>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {isEditing && (
                <tr className="align-middle">
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={newLineDraft.line_supplementary_notice === "1"}
                      onChange={(e) => setNewLineDraft((prev) => ({ ...prev, line_supplementary_notice: e.target.checked ? "1" : "0" }))}
                      disabled={!placeholderActive}
                    />
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={placeholderActive ? newLineDraft.line_currency : ""}
                      onChange={(e) => setNewLineDraft((prev) => ({ ...prev, line_currency: e.target.value }))}
                      disabled={!placeholderActive}
                    >
                      <option value=""></option>
                      {lineCurrencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={placeholderActive ? newLineDraft.line_amount : ""}
                      onChange={(e) => setNewLineDraft((prev) => ({ ...prev, line_amount: e.target.value }))}
                      disabled={!placeholderActive}
                    />
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={placeholderActive ? newLineDraft.line_debet_account : ""}
                      onChange={(e) => setNewLineDraft((prev) => ({ ...prev, line_debet_account: e.target.value }))}
                      disabled={!placeholderActive}
                    >
                      <option value=""></option>
                      {accounts.map((acc) => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={placeholderActive ? newLineDraft.line_credit_account : ""}
                      onChange={(e) => setNewLineDraft((prev) => ({ ...prev, line_credit_account: e.target.value }))}
                      disabled={!placeholderActive}
                    >
                      <option value=""></option>
                      {accounts.map((acc) => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={placeholderActive ? newLineDraft.line_vat_rate : ""}
                      onChange={(e) => setNewLineDraft((prev) => ({ ...prev, line_vat_rate: e.target.value }))}
                      disabled={!placeholderActive}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={placeholderActive ? newLineDraft.line_comments : ""}
                      onChange={(e) => setNewLineDraft((prev) => ({ ...prev, line_comments: e.target.value }))}
                      disabled={!placeholderActive}
                    />
                  </td>
                  <td className="text-center">
                    <Button
                      size="sm"
                      className="custom-dark-hover"
                      onClick={() => {
                        setPlaceholderActive(true);
                        setEditedLines((prev) => [...prev, { ...newLineDraft, id: `new-${Date.now()}` }]);
                        setNewLineDraft({
                          id: null,
                          line_currency: "EUR",
                          line_amount: "0.00",
                          line_debet_account: "",
                          line_credit_account: "",
                          line_vat_rate: "",
                          line_comments: "",
                          line_supplementary_notice: "1",
                        });
                        setPlaceholderActive(false);
                      }}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Form>
      </Card.Body>
    </Collapse>
  );
}
