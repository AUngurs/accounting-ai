import React, { useState } from "react";
import { useCompany } from "../../components/CompanyContext";
import PartnersControls from "./PartnersControls";
import PartnersTableHeader from "./PartnersTableHeader";
import PartnersTableBody from "./PartnersTableBody";
import PartnerModal from "./PartnerModal";
import VirtualizedTableContainer from "../../components/VirtualizedTableContainer";
import { usePartners } from "./usePartners";
import { Table } from "react-bootstrap";

export default function Partners() {
  const { companyId } = useCompany();
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRowsCount, setVisibleRowsCount] = useState(20);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const ROW_HEIGHT = 24;

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
  } = usePartners(companyId);

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

      <VirtualizedTableContainer
        rowHeight={ROW_HEIGHT}
        offsetPx={280}
        onScrollChange={setScrollTop}
        onVisibleRowsChange={setVisibleRowsCount}
      >
        <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
          <PartnersTableBody
            visibleRows={visibleRows}
            filteredPartners={filteredPartners}
            scrollTop={scrollTop}
            selectedPartners={selectedPartners}
            setSelectedPartners={setSelectedPartners}
            handleEditClick={handleEditClick}
            visibleRowsCount={visibleRowsCount}
          />
        </Table>
      </VirtualizedTableContainer>

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
