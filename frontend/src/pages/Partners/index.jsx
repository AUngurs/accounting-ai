import React, { useState } from "react";
import { useCompany } from "../../components/CompanyContext";
import PartnersControls from "./PartnersControls";
import PartnersTableHeader from "./PartnersTableHeader";
import PartnersTableBody from "./PartnersTableBody";
import PartnerModal from "../../components/PartnerModal";
import { usePartners } from "./usePartners";
import { Table } from "react-bootstrap";

const ROW_HEIGHT = 24;
const VISIBLE_ROWS = 29;

export default function Partners() {
  const { companyId } = useCompany();
  const [scrollTop, setScrollTop] = useState(0);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const {
    partnersData,
    filteredPartners,
    visibleRows,
    selectedPartners,
    setSelectedPartners,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    handleCreate,
    handleSave,
    handleDelete,
    handleImport,
    handleExport,
    handleDeleteSelected,
  } = usePartners(companyId, ROW_HEIGHT, VISIBLE_ROWS, scrollTop);

  const handleCreateClick = () => {
    setSelectedPartner(null);
    setShowModal(true);
  };

  const handleEditClick = (partner) => {
    setSelectedPartner(partner);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedPartner(null);
    setShowModal(false);
  };

  return (
    <div>
      <h2 className="mb-3">Partneri</h2>

      <PartnersControls
        selectedPartners={selectedPartners}
        handleCreateClick={handleCreateClick}
        handleImport={handleImport}
        handleExport={handleExport}
        handleDeleteSelected={handleDeleteSelected}
      />

      <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
        <PartnersTableHeader
          filters={filters}
          setFilters={setFilters}
          sortConfig={sortConfig}
          handleSort={handleSort}
          selectedPartners={selectedPartners}
          setSelectedPartners={setSelectedPartners}
          partnersData={partnersData}
        />
      </Table>

      <div
        style={{ height: ROW_HEIGHT * VISIBLE_ROWS, overflowY: "auto", borderBottom: "6px solid #19221c" }}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
      >
        <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
          <PartnersTableBody
            visibleRows={visibleRows}
            filteredPartners={filteredPartners}
            ROW_HEIGHT={ROW_HEIGHT}
            VISIBLE_ROWS={VISIBLE_ROWS}
            scrollTop={scrollTop}
            selectedPartners={selectedPartners}
            setSelectedPartners={setSelectedPartners}
            handleEditClick={handleEditClick}
          />
        </Table>
      </div>

      <PartnerModal
        show={showModal}
        handleClose={closeModal}
        partner={selectedPartner}
        onSave={selectedPartner ? handleSave : handleCreate}
        onDelete={handleDelete}
        partners={partnersData}
      />
    </div>
  );
}
