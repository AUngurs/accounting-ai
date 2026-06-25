import React from "react";
import AmountInput from "../../utils/AmountInput";

// Komponente, kas renderē dokumentu tabulas galveni ar kārtošanu un filtriem
export default function FinancialDocsTableHeader({
  filters, // Objekts ar filtriem (datums, summa, dok. nr., partneris utt.)
  setFilters, // Funkcija filtru atjaunināšanai
  sortConfig, // Objekts ar kārtošanas informāciju: { key, direction }
  handleSort, // Funkcija, kas maina kārtošanas konfigurāciju
  partnersData, // Masīvs ar partneru datiem
  selectedDocs, // Set ar izvēlētajiem dokumentiem
  setSelectedDocs, // Funkcija izvēlētu dokumentu atjaunināšanai
  filteredDocs, // Masīvs ar filtrētiem dokumentiem (checkbox galvenē)
  docTypeOptions, // Masīvs ar dokumenta tipu iespējām
  docCurrencyOptions, // Masīvs ar valūtu iespējām
}) {
  return (
    <React.Fragment>
      {/* Definē kolonnu platumus */}
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

      <thead>
        {/* Pirmā rinda: galvenes ar kārtošanas pogām */}
        <tr className="align-middle">
          {/* Checkbox, kas izvēlas/atceļ visus filtrētos dokumentus */}
          <th style={{ textAlign: "center", borderBottom: "none" }}>
            <input
              type="checkbox"
              className="form-check-input"
              checked={selectedDocs.size === filteredDocs.length && filteredDocs.length > 0}
              onChange={(e) => setSelectedDocs(e.target.checked ? new Set(filteredDocs.map((d) => d.id)) : new Set())}
            />
          </th>

          {/* Galvenes ar kārtošanu klikšķa funkcionalitāti */}
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

        {/* Otrā rinda: filtri (daži lauki) */}
        <tr>
          <th style={{ borderBottom: "none" }}></th>
          <th style={{ borderBottom: "none" }}>
            <input
              name="date-from"
              type="date"
              className="form-control form-control-sm"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </th>
          <th style={{ borderBottom: "none" }}></th>
          <th style={{ borderBottom: "none" }}></th>
          <th style={{ borderBottom: "none" }}></th>
          <th style={{ borderBottom: "none" }}></th>
          <th style={{ borderBottom: "none" }}>
            <AmountInput
              name="amount-from"
              size="sm"
              placeholder="No"
              value={filters.amountMin}
              onChange={(val) => setFilters({ ...filters, amountMin: val })}
            />
          </th>
          <th style={{ borderBottom: "none" }}></th>
          <th style={{ borderBottom: "none" }}></th>
        </tr>

        {/* Trešā rinda: papildus filtri */}
        <tr>
          <th></th>
          <th>
            <input
              name="date-to"
              type="date"
              className="form-control form-control-sm"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </th>
          <th>
            <input
              name="doc-id"
              type="text"
              className="form-control form-control-sm"
              placeholder="Dokumenta nr."
              value={filters.docId}
              onChange={(e) => setFilters({ ...filters, docId: e.target.value })}
            />
          </th>
          <th>
            {/* Partnera filtrs ar sakārtotu select */}
            <select
              name="partner-id"
              className="form-select form-select-sm"
              value={filters.partnerId}
              onChange={(e) => setFilters({ ...filters, partnerId: e.target.value })}
            >
              <option value="">Visi</option>
              {partnersData
                .slice()
                .sort((a, b) => (a.formatted_name || "").localeCompare(b.formatted_name || "", "lv", { sensitivity: "base" }))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.formatted_name}
                  </option>
                ))}
            </select>
          </th>
          <th>
            {/* Dokumenta tipa filtrs */}
            <select
              name="doc-type"
              className="form-select form-select-sm"
              value={filters.docType}
              onChange={(e) => setFilters({ ...filters, docType: e.target.value })}
            >
              <option value="">Visi</option>
              {docTypeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </th>
          <th>
            {/* Valūtas filtrs */}
            <select
              name="doc-currency"
              className="form-select form-select-sm"
              value={filters.currency}
              onChange={(e) => setFilters({ ...filters, currency: e.target.value })}
            >
              <option value="">Visi</option>
              {docCurrencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </th>
          <th>
            {/* AmountInput filtrs "Līdz" */}
            <AmountInput
              name="amount-to"
              size="sm"
              placeholder="Līdz"
              value={filters.amountMax}
              onChange={(val) => setFilters({ ...filters, amountMax: val })}
            />
          </th>
          <th>
            <input
              name="doc-comments"
              type="text"
              className="form-control form-control-sm"
              placeholder="Meklēt..."
              value={filters.comments}
              onChange={(e) => setFilters({ ...filters, comments: e.target.value })}
            />
          </th>
          <th className="text-center align-middle p-0">
            {/* Notīrīšanas poga visiem filtriem un izvēlētajiem dokumentiem */}
            <button
              type="button"
              className="btn btn-app-danger btn-sm"
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
