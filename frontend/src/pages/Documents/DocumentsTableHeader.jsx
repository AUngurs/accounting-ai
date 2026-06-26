import React from "react";
import AmountInput from "../../utils/AmountInput";

// Padding overrides for compact filter rows
const FTH = { padding: "3px 0.6rem", borderBottom: "none" };
const FTH_LAST = { padding: "3px 0.6rem" };
const LABEL_TH = {
  padding: "3px 0.4rem",
  borderBottom: "none",
  fontSize: "0.72rem",
  color: "var(--text-muted)",
  fontWeight: 500,
  textAlign: "right",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default function FinancialDocsTableHeader({
  filters,
  setFilters,
  sortConfig,
  handleSort,
  partnersData,
  selectedDocs,
  setSelectedDocs,
  filteredDocs,
  docTypeOptions,
  docCurrencyOptions,
}) {
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

      <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
        {/* Row 1: sortable column headers */}
        <tr className="align-middle">
          <th style={{ textAlign: "center", borderBottom: "none" }}>
            <input
              type="checkbox"
              className="form-check-input"
              checked={selectedDocs.size === filteredDocs.length && filteredDocs.length > 0}
              onChange={(e) => setSelectedDocs(e.target.checked ? new Set(filteredDocs.map((d) => d.id)) : new Set())}
            />
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_date")}>
            Datums {sortConfig.key === "doc_date" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_id")}>
            Nr. {sortConfig.key === "doc_id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("partner_id")}>
            Partneris {sortConfig.key === "partner_id" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_type_abbrev")}>
            Dok. tips {sortConfig.key === "doc_type_abbrev" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_currency")}>
            Valūta {sortConfig.key === "doc_currency" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_amount")}>
            Summa {sortConfig.key === "doc_amount" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("doc_comments")}>
            Piezīmes {sortConfig.key === "doc_comments" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ borderBottom: "none" }}></th>
        </tr>

        {/* Row 2: "No" filters */}
        <tr>
          <th style={LABEL_TH}>No</th>
          <th style={FTH}>
            <input
              name="date-from"
              type="date"
              className="form-control form-control-sm"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </th>
          <th style={FTH}></th>
          <th style={FTH}></th>
          <th style={FTH}></th>
          <th style={FTH}></th>
          <th style={FTH}>
            <AmountInput
              name="amount-from"
              size="sm"
              placeholder="No"
              value={filters.amountMin}
              onChange={(val) => setFilters({ ...filters, amountMin: val })}
            />
          </th>
          <th style={FTH}></th>
          <th style={FTH}></th>
        </tr>

        {/* Row 3: "Līdz" filters + all other column filters */}
        <tr>
          <th style={{ ...LABEL_TH, borderBottom: undefined }}>Līdz</th>
          <th style={FTH_LAST}>
            <input
              name="date-to"
              type="date"
              className="form-control form-control-sm"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </th>
          <th style={FTH_LAST}>
            <input
              name="doc-id"
              type="text"
              className="form-control form-control-sm"
              placeholder="Dokumenta nr."
              value={filters.docId}
              onChange={(e) => setFilters({ ...filters, docId: e.target.value })}
            />
          </th>
          <th style={FTH_LAST}>
            <select
              className="form-select form-select-sm"
              value={filters.partnerId}
              onChange={(e) => setFilters({ ...filters, partnerId: e.target.value })}
            >
              <option value="">Visi</option>
              {partnersData
                .slice()
                .sort((a, b) => (a.formatted_name || "").localeCompare(b.formatted_name || "", "lv", { sensitivity: "base" }))
                .map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.formatted_name}</option>
                ))}
            </select>
          </th>
          <th style={FTH_LAST}>
            <select
              name="doc-type"
              className="form-select form-select-sm"
              value={filters.docType}
              onChange={(e) => setFilters({ ...filters, docType: e.target.value })}
            >
              <option value="">Visi</option>
              {docTypeOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </th>
          <th style={FTH_LAST}>
            <select
              name="doc-currency"
              className="form-select form-select-sm"
              value={filters.currency}
              onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
            >
              <option value="">Visi</option>
              {docCurrencyOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </th>
          <th style={FTH_LAST}>
            <AmountInput
              name="amount-to"
              size="sm"
              placeholder="Līdz"
              value={filters.amountMax}
              onChange={(val) => setFilters({ ...filters, amountMax: val })}
            />
          </th>
          <th style={FTH_LAST}>
            <input
              name="doc-comments"
              type="text"
              className="form-control form-control-sm"
              placeholder="Meklēt..."
              value={filters.comments}
              onChange={(e) => setFilters({ ...filters, comments: e.target.value })}
            />
          </th>
          <th style={{ padding: 0, textAlign: "center", verticalAlign: "middle" }}>
            <button
              type="button"
              className="btn-app-danger btn-app-sm"
              onClick={() => {
                setFilters({
                  dateFrom: "",
                  dateTo: "",
                  docId: "",
                  partnerId: "",
                  docType: "",
                  currency: "",
                  amountMin: "",
                  amountMax: "",
                  comments: "",
                });
                setSelectedDocs(new Set());
              }}
            >
              <i className="bi bi-x-square" style={{ fontSize: "1rem" }}></i>
            </button>
          </th>
        </tr>
      </thead>
    </React.Fragment>
  );
}
