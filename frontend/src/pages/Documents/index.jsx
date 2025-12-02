import React, { useState } from "react";
import { useCompany } from "../../components/CompanyContext";
import DocumentsControls from "./DocumentsControls";
import DocumentsTableHeader from "./DocumentsTableHeader";
import DocumentsTableBody from "./DocumentsTableBody";
import { useDocuments } from "./useDocuments";
import DocumentModal from "../../components/DocumentModal";
import { Table } from "react-bootstrap";

const ROW_HEIGHT = 24;
const VISIBLE_ROWS = 27;

export default function Documents() {
  const { companyId } = useCompany();
  const [scrollTop, setScrollTop] = useState(0);
  const [openDocId, setOpenDocId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const {
    docCurrencyOptions,
    docsData,
    docTypeOptions,
    partnersData,
    selectedDocs,
    setSelectedDocs,
    filteredDocs,
    filters,
    setFilters,
    sortConfig,
    sortedDocs,
    handleSort,
    partnerMap,
    handleCreate,
    handleSave,
    handleDelete,
    handleExport,
    handleImport,
    handleDeleteSelected,
    handleUpdateAccounted,
  } = useDocuments(companyId);

  const handleCreateClick = () => {
    setSelectedDocument(null);
    setShowModal(true);
  };

  const handleEditClick = (doc) => {
    setSelectedDocument(doc);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedDocument(null);
    setShowModal(false);
  };

  return (
    <div>
      <h2 className="mb-3">Finanšu dokumenti</h2>

      <DocumentsControls
        handleCreateClick={handleCreateClick}
        handleImport={handleImport}
        handleExport={handleExport}
        handleDeleteSelected={handleDeleteSelected}
        selectedDocs={selectedDocs}
      />

      <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
        <DocumentsTableHeader
          filters={filters}
          setFilters={setFilters}
          sortConfig={sortConfig}
          handleSort={handleSort}
          partnersData={partnersData}
          selectedDocs={selectedDocs}
          setSelectedDocs={setSelectedDocs}
          filteredDocs={filteredDocs}
          docTypeOptions={docTypeOptions}
          docCurrencyOptions={docCurrencyOptions}
        />
      </Table>

      <div
        style={{ height: ROW_HEIGHT * VISIBLE_ROWS, overflowY: "auto", borderBottom: "6px solid #19221c" }}
        onScroll={(e) => setScrollTop(e.target.scrollTop)}
      >
        <Table hover size="sm" className="table-dark-custom" style={{ tableLayout: "fixed", marginBottom: 0 }}>
          <DocumentsTableBody
            docsData={docsData}
            partnerMap={partnerMap}
            openDocId={openDocId}
            setOpenDocId={setOpenDocId}
            selectedDocs={selectedDocs}
            setSelectedDocs={setSelectedDocs}
            scrollTop={scrollTop}
            companyId={companyId}
            handleEditClick={handleEditClick}
            sortedDocs={sortedDocs}
            handleUpdateAccounted={handleUpdateAccounted}
          />
        </Table>
      </div>

      <DocumentModal
        show={showModal}
        handleClose={closeModal}
        documentData={selectedDocument}
        onSave={selectedDocument ? handleSave : handleCreate}
        onDelete={handleDelete}
        partners={partnersData}
        documents={docsData}
      />
    </div>
  );
}
