import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { Form } from "react-bootstrap";
import Select, { components } from "react-select";
import { documentLineRules } from "../../utils/Validators";
import AmountInput from "../../utils/AmountInput";
import { notify } from "../../utils/Notify";

const lineCurrencyOptions = ["EUR", "DKK", "GBP", "LVL", "NOK", "PLN", "RUB", "SEK", "USD"];

// Custom MenuList that scrolls to the selected option when the dropdown opens
const ScrollToSelectedMenuList = ({ children, ...props }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      const el = ref.current.querySelector('[aria-selected="true"]');
      if (el) {
        ref.current.scrollTop =
          el.offsetTop - ref.current.clientHeight / 2 + el.clientHeight / 2;
      }
    }
  }, []);
  return (
    <components.MenuList {...props} innerRef={ref}>
      {children}
    </components.MenuList>
  );
};

const makeAccountSelectStyles = (isInvalid = false) => ({
  control: (base, state) => ({
    ...base,
    minHeight: "26px",
    height: "26px",
    fontSize: "0.78rem",
    borderColor: isInvalid ? "#dc3545" : state.isFocused ? "#4f46e5" : "#e2e8f0",
    boxShadow: state.isFocused
      ? isInvalid
        ? "0 0 0 0.15rem rgba(220,53,69,0.25)"
        : "0 0 0 0.15rem rgba(79,70,229,0.2)"
      : "none",
    "&:hover": { borderColor: isInvalid ? "#dc3545" : "#4f46e5" },
    borderRadius: "4px",
  }),
  valueContainer: (base) => ({ ...base, padding: "0 4px", height: "26px", flexWrap: "nowrap" }),
  indicatorsContainer: (base) => ({ ...base, height: "26px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, padding: "0 4px" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menu: (base) => ({ ...base, fontSize: "0.78rem" }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#4f46e5" : state.isFocused ? "#f1f5f9" : "white",
    color: state.isSelected ? "white" : "#1e293b",
    padding: "4px 8px",
  }),
});

function normalizeLineFetch(line) {
  return {
    ...line,
    line_debet_account: line.line_debet_account?.toString() || "",
    line_credit_account: line.line_credit_account?.toString() || "",
    line_currency: line.line_currency || "EUR",
    line_vat_rate: line.line_vat_rate ?? null,
    line_comments: line.line_comments || "",
    line_supplementary_notice: line.line_supplementary_notice || "0",
  };
}

// Show only account code in the selected value; show "code - name" in the dropdown list
const formatAccountOption = (opt, { context }) =>
  context === "value" ? opt.code : `${opt.code} - ${opt.name}`;

const DocumentLines = forwardRef(function DocumentLines({ companyId, documentId, onUpdateAccounted, accounts }, ref) {
  const [lines, setLines] = useState([]);
  const [editedLines, setEditedLines] = useState([]);
  const amountRefs = useRef({});
  const justAddedIdRef = useRef(null);
  const [newLineDraft, setNewLineDraft] = useState({
    line_currency: "EUR",
    line_amount: "0.00",
    line_debet_account: "",
    line_credit_account: "",
    line_vat_rate: "",
    line_comments: "",
    line_supplementary_notice: "1",
  });
  const [lineErrors, setLineErrors] = useState({});

  useEffect(() => {
    if (!documentId || !companyId) {
      setLines([]);
      setEditedLines([]);
      setLineErrors({});
      return;
    }
    axiosInstance
      .get(`/companies/${companyId}/documents/${documentId}/lines`)
      .then((res) => {
        setLines(res.data);
        setEditedLines(res.data.map(normalizeLineFetch));
      })
      .catch((err) => {
        console.error(err);
        notify.error("Neparedzēta servera kļūda");
      });
  }, [companyId, documentId]);

  // After each render, focus the amount input of a newly added row
  useEffect(() => {
    if (justAddedIdRef.current && amountRefs.current[justAddedIdRef.current]) {
      const el = amountRefs.current[justAddedIdRef.current];
      el.focus();
      el.select();
      justAddedIdRef.current = null;
    }
  });

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

  const validateLines = () => {
    if (editedLines.length === 0) return true;
    const errors = {};
    editedLines.forEach((line) => {
      const errs = documentLineRules(line);
      if (Object.keys(errs).length > 0) errors[line.id || line.tempId] = errs;
    });
    if (Object.keys(errors).length > 0) {
      setLineErrors(errors);
      return false;
    }
    setLineErrors({});
    return true;
  };

  const saveLinesForDoc = async (docId) => {
    if (editedLines.length === 0 && lines.length === 0) return true;

    try {
      const defaultAccount = accounts.length > 0 ? accounts[0].code : "11";
      const linesToSave = editedLines.map((line) => ({
        ...line,
        line_debet_account: line.line_debet_account || defaultAccount,
        line_credit_account: line.line_credit_account || defaultAccount,
        line_vat_rate: line.line_vat_rate ? Number(line.line_vat_rate) : null,
      }));

      const deletedLineIds = lines
        .filter((l) => !linesToSave.find((s) => s.id === l.id))
        .map((l) => l.id);
      const updatedLines = linesToSave.filter((l) => l.id && !String(l.id).startsWith("new-"));
      const newLines = linesToSave.filter((l) => !l.id || String(l.id).startsWith("new-"));

      const { data } = await axiosInstance.put(
        `/companies/${companyId}/documents/${docId}/lines`,
        { updated: updatedLines, inserted: newLines, deleted: deletedLineIds }
      );

      const allLines = data.allLines;

      const totalCents = allLines
        .filter((l) => l.line_supplementary_notice === "1")
        .reduce((sum, l) => sum + Math.round(Number(l.line_amount || 0) * 100), 0);

      const { data: docs } = await axiosInstance.get(`/companies/${companyId}/documents/${docId}`);
      const docAmountCents = Math.round(Number(docs[0].doc_amount) * 100);
      const is_accounted = totalCents === docAmountCents;

      const { data: updatedDoc } = await axiosInstance.put(
        `/companies/${companyId}/documents/${docId}/accounted`,
        { is_accounted }
      );
      if (onUpdateAccounted) onUpdateAccounted(updatedDoc);

      setLines(allLines);
      setEditedLines(allLines.map(normalizeLineFetch));
      return true;
    } catch (err) {
      console.error(err);
      notify.error("Neparedzēta servera kļūda");
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    validateLines,
    saveLinesForDoc,
    getEditedLines: () => editedLines,
    reset: () => { setLines([]); setEditedLines([]); setLineErrors({}); },
  }));

  const totalSum = editedLines
    .filter((l) => l.line_supplementary_notice === "1")
    .reduce((sum, l) => sum + Number(l.line_amount || 0), 0);

  function handleAddLine() {
    const newId = `new-${Date.now()}`;
    justAddedIdRef.current = newId;
    setEditedLines((prev) => [...prev, { ...newLineDraft, id: newId }]);
    setNewLineDraft({
      line_currency: "EUR",
      line_amount: "0.00",
      line_debet_account: "",
      line_credit_account: "",
      line_vat_rate: "",
      line_comments: "",
      line_supplementary_notice: "1",
    });
  }

  const accountOptions = accounts.map((acc) => ({
    value: acc.code.toString(),
    label: `${acc.code} - ${acc.name}`,
    code: acc.code.toString(),
    name: acc.name,
  }));

  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
        Kontējums
      </div>
      <Form>
        <div style={{ overflowX: "auto" }}>
          <table className="app-table mb-0" style={{ minWidth: 640, tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "3%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "39%" }} />
              <col style={{ width: "42px" }} />
            </colgroup>

            <thead>
              <tr>
                <th></th>
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
              {editedLines.map((line, index) => (
                <tr key={line.id || `new-${index}`} className="align-middle">
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={line.line_supplementary_notice === "1"}
                      onChange={(e) => updateLine(index, "line_supplementary_notice", e.target.checked ? "1" : "0")}
                    />
                  </td>

                  <td>
                    <React.Fragment>
                      <Form.Select
                        size="sm"
                        value={line.line_currency}
                        onChange={(e) => updateLine(index, "line_currency", e.target.value)}
                        isInvalid={!!lineErrors[line.id]?.line_currency}
                      >
                        {lineCurrencyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_currency}</Form.Control.Feedback>
                    </React.Fragment>
                  </td>

                  <td>
                    <React.Fragment>
                      <AmountInput
                        ref={(el) => { amountRefs.current[line.id] = el; }}
                        size="sm"
                        value={line.line_amount}
                        onChange={(val) => updateLine(index, "line_amount", val)}
                        isInvalid={!!lineErrors[line.id]?.line_amount}
                      />
                      <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_amount}</Form.Control.Feedback>
                    </React.Fragment>
                  </td>

                  <td>
                    <Select
                      options={accountOptions}
                      value={accountOptions.find((o) => o.value === (line.line_debet_account || "")) || null}
                      onChange={(opt) => updateLine(index, "line_debet_account", opt?.value || "")}
                      formatOptionLabel={formatAccountOption}
                      styles={makeAccountSelectStyles(!!lineErrors[line.id]?.line_debet_account)}
                      components={{ MenuList: ScrollToSelectedMenuList }}
                      placeholder=""
                      noOptionsMessage={() => "Nav rezultātu"}
                      isClearable={false}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                    {lineErrors[line.id]?.line_debet_account && (
                      <div style={{ color: "#dc3545", fontSize: "0.75em", marginTop: "2px" }}>
                        {lineErrors[line.id].line_debet_account}
                      </div>
                    )}
                  </td>

                  <td>
                    <Select
                      options={accountOptions}
                      value={accountOptions.find((o) => o.value === (line.line_credit_account || "")) || null}
                      onChange={(opt) => updateLine(index, "line_credit_account", opt?.value || "")}
                      formatOptionLabel={formatAccountOption}
                      styles={makeAccountSelectStyles(!!lineErrors[line.id]?.line_credit_account)}
                      components={{ MenuList: ScrollToSelectedMenuList }}
                      placeholder=""
                      noOptionsMessage={() => "Nav rezultātu"}
                      isClearable={false}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                    {lineErrors[line.id]?.line_credit_account && (
                      <div style={{ color: "#dc3545", fontSize: "0.75em", marginTop: "2px" }}>
                        {lineErrors[line.id].line_credit_account}
                      </div>
                    )}
                  </td>

                  <td>
                    <React.Fragment>
                      <Form.Control
                        size="sm"
                        type="text"
                        inputMode="decimal"
                        value={line.line_vat_rate || ""}
                        onChange={(e) => updateLine(index, "line_vat_rate", e.target.value)}
                        isInvalid={!!lineErrors[line.id]?.line_vat_rate}
                      />
                      <Form.Control.Feedback type="invalid">{lineErrors[line.id]?.line_vat_rate}</Form.Control.Feedback>
                    </React.Fragment>
                  </td>

                  <td>
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
                  </td>

                  <td style={{ padding: "0 3px" }}>
                    <button
                      type="button"
                      className="btn-app-danger"
                      style={{ padding: "2px 6px" }}
                      onClick={() => deleteLine(index)}
                    >
                      <i className="bi bi-x-lg" style={{ fontSize: "0.75rem" }}></i>
                    </button>
                  </td>
                </tr>
              ))}

            </tbody>

            <tfoot>
              <tr>
                <td
                  colSpan={2}
                  style={{
                    textAlign: "right",
                    padding: "0.3rem 0.6rem",
                    borderTop: "2px solid var(--border)",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  Kopsumma:
                </td>
                <td
                  style={{
                    padding: "0.3rem 0.6rem",
                    borderTop: "2px solid var(--border)",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                  }}
                >
                  {totalSum.toFixed(2)}
                </td>
                <td colSpan={3} style={{ borderTop: "2px solid var(--border)" }} />
                <td colSpan={2} style={{ borderTop: "2px solid var(--border)", padding: "0.15rem 0.4rem", textAlign: "right" }}>
                  <button type="button" className="btn-app btn-app-sm" onClick={handleAddLine}>
                    <i className="bi bi-plus-lg"></i> Pievienot rindu
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Form>
    </div>
  );
});

export default DocumentLines;
