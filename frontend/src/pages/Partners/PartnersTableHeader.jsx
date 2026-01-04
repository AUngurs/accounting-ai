import React from "react";

export default function PartnersTableHeader({
  filters,
  setFilters,
  sortConfig,
  handleSort,
  selectedPartners,
  setSelectedPartners,
  partnersData,
}) {
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

      <thead>
        {/* Galvenes rinda ar kolonnu nosaukumiem un kārtošanas indikatoriem */}
        <tr className="align-middle">
          <th style={{ textAlign: "center", borderBottom: "none" }}>
            {/* "Select all" checkbox */}
            <input
              type="checkbox"
              className="form-check-input"
              checked={selectedPartners.size === partnersData.length && partnersData.length > 0}
              onChange={(e) => setSelectedPartners(e.target.checked ? new Set(partnersData.map((p) => p.id)) : new Set())}
            />
          </th>

          {/* Kolonnu nosaukumi ar click funkciju kārtošanai */}
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("fullName")}>
            Nosaukums/Uzvārds, vārds {sortConfig.key === "fullName" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("partner_kind_name")}>
            Tips {sortConfig.key === "partner_kind_name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("partner_reg_nr")}>
            Reģ. Nr./Personas kods {sortConfig.key === "partner_reg_nr" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ cursor: "pointer", borderBottom: "none" }} onClick={() => handleSort("vat_nr")}>
            PVN Nr. {sortConfig.key === "vat_nr" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
          </th>
          <th style={{ borderBottom: "none" }}></th>
        </tr>

        {/* Filtru rinda zem galvenes */}
        <tr>
          <th></th>
          <th>
            <input
              name="name"
              autoComplete="off"
              type="text"
              className="form-control form-control-sm"
              placeholder="Meklēt nosaukumu"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </th>
          <th>
            <select
              name="type"
              className="form-select form-select-sm"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Visi</option>
              <option value="Juridiska persona">Juridiska persona</option>
              <option value="Fiziska persona">Fiziska persona</option>
              <option value="Darbinieks">Darbinieks</option>
            </select>
          </th>
          <th>
            <input
              name="reg-nr"
              type="text"
              className="form-control form-control-sm"
              placeholder="Reģ. Nr"
              value={filters.regNr}
              onChange={(e) => setFilters({ ...filters, regNr: e.target.value })}
            />
          </th>
          <th>
            <input
              name="vat-nr"
              type="text"
              className="form-control form-control-sm"
              placeholder="PVN Nr"
              value={filters.vat}
              onChange={(e) => setFilters({ ...filters, vat: e.target.value })}
            />
          </th>
          <th className="text-center align-middle p-0">
            {/* Poga filtru atiestatīšanai un visu atlases notīrīšanai */}
            <button
              type="button"
              className="btn btn-sm custom-red-hover"
              onClick={() => {
                setFilters({ name: "", type: "", regNr: "", vat: "" });
                setSelectedPartners(new Set());
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
